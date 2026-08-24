import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import * as d3 from 'd3';
import { Subscription } from 'rxjs';
import { ResultsInterface } from '../../../../models/results/results.interface';
import { PageInterface } from '../../../../models/page/page.interface';
import { ResultsModel } from '../../../../models/results/results-model.service';
import { PageModel } from '../../../../models/page/page.service';
import { StateInterface } from '../../../../models/state/state.interface';
import { StateModel } from '../../../../models/state/state.service';
import { ExamService } from '../../../../controllers/exam.service';
import { Logger } from '../../../../services/logger.service';
import { Notifications } from '../../../../services/notifications.service';
import { DevicesService } from '../../../../services/devices/devices.service';
import { calculateSvantekBandLevel, isSvantekDevice } from '../../../../services/devices/svantek-manager';
import { DeviceType, DialogType } from '../../../../utilities/constants';
import { ISvantekDevice } from '../../../../interfaces/devices/svantek-device.interface';
import { mpanlSchema } from '../../../../../schema/response-areas/mpanl.schema';
import { MpanlDatumInterface, MpanlResponseAreaInterface, MpanlResultsInterface, MpanlStandard } from './mpanl.interface';
import { createLegend, createOAEResultsChartSvg, plotDpoaeSeries } from '../../../../utilities/d3-plot-functions';

/** Octave band center frequencies, Hz - used to validate configured frequencies and to look up noise floors. */
const OCTAVE_BAND_FREQUENCIES = new Set([125, 250, 500, 1000, 2000, 4000, 8000]);

/** Per-standard octave band frequencies, limits (dB), and WAHTS headset attenuation (dB). */
const STANDARD_DEFAULTS: Record<MpanlStandard, { freqs: number[]; limits: number[]; wahtsAttenuation: number[] }> = {
  'ANSI S3.1-R2008': {
    freqs: [125, 250, 500, 1000, 2000, 4000, 8000],
    limits: [35, 21, 16, 13, 14, 11, 14],
    wahtsAttenuation: [30.6, 31.6, 37.5, 39.5, 34.5, 36.0, 36.9],
  },
  DoD: {
    freqs: [500, 1000, 2000, 4000, 8000],
    limits: [27, 29, 34, 39, 41],
    wahtsAttenuation: [37.5, 39.5, 34.5, 36.0, 36.9],
  },
  OSHA: {
    freqs: [500, 1000, 2000, 4000, 8000],
    limits: [40, 40, 47, 57, 62],
    wahtsAttenuation: [37.5, 39.5, 34.5, 36.0, 36.9],
  },
};

/** Nearest-octave-band noise floor of the Svantek dosimeter itself, dB SPL. */
const NOISE_FLOOR_BY_FREQUENCY: Record<number, number> = {
  125: 41.5,
  250: 41.2,
  500: 41.2,
  1000: 42.1,
  2000: 44.1,
  4000: 46.5,
  8000: 50.5,
};

type MpanlState = 'start' | 'recording' | 'results';

@Component({
  selector: 'app-mpanl',
  templateUrl: './mpanl.component.html',
  styleUrl: './mpanl.component.css',
})
export class MpanlComponent implements OnInit, OnDestroy {
  private readonly examService = inject(ExamService);
  private readonly resultsModel = inject(ResultsModel);
  private readonly pageModel = inject(PageModel);
  private readonly stateModel = inject(StateModel);
  private readonly devicesService = inject(DevicesService);
  private readonly notifications = inject(Notifications);
  private readonly logger = inject(Logger);

  results: ResultsInterface;
  state: StateInterface;
  examState: MpanlState = 'start';

  standard: MpanlStandard = mpanlSchema.properties.standard.default;
  durations: number[] = mpanlSchema.properties.durations.default;
  autoSubmit: boolean = mpanlSchema.properties.autoSubmit.default;
  tabsintId: string | undefined;

  mpanlResults: MpanlResultsInterface | undefined;

  private freqs: number[] = [];
  private limits: number[] = [];
  private attenuation: number[] = [];
  private device: ISvantekDevice | undefined;
  private recordingTimeout: ReturnType<typeof setTimeout> | undefined;
  private isDestroyed = false;

  pageSubscription: Subscription | undefined;
  stateSubscription: Subscription | undefined;
  resultsSubscription: Subscription | undefined;

  constructor() {
    this.results = this.resultsModel.getResults();
    this.state = this.stateModel.getState();
  }

  ngOnInit(): void {
    this.stateSubscription = this.stateModel.stateSubject.subscribe((updatedState: StateInterface) => {
      this.state = updatedState;
    });
    this.resultsSubscription = this.resultsModel.resultsSubject.subscribe((updatedResults: ResultsInterface) => {
      this.results = updatedResults;
    });
    this.pageSubscription = this.pageModel.currentPageObservable.subscribe((updatedPage: PageInterface) => {
      if (updatedPage?.responseArea?.type !== 'mpanlResponseArea') {
        return;
      }
      const responseArea = updatedPage.responseArea as MpanlResponseAreaInterface;

      this.examState = 'start';
      this.mpanlResults = undefined;
      this.standard = responseArea.standard ?? mpanlSchema.properties.standard.default;
      this.durations = responseArea.durations ?? mpanlSchema.properties.durations.default;
      this.autoSubmit = responseArea.autoSubmit ?? mpanlSchema.properties.autoSubmit.default;
      this.tabsintId = responseArea.tabsintId;

      this.examService.skip = () => {
        this.resultsModel.updateCurrentPage({ response: 'skipped' });
        this.examService.submit();
      };

      if (!this.resolveConfig(responseArea)) {
        return;
      }
    });
  }

  ngOnDestroy(): void {
    this.isDestroyed = true;
    this.clearRecordingTimeout();
    if (this.device) {
      this.devicesService.stopRecording(this.device).catch(err => this.logger.debug('Failed to stop Svantek recording on destroy', err));
    }
    this.pageSubscription?.unsubscribe();
    this.stateSubscription?.unsubscribe();
    this.resultsSubscription?.unsubscribe();
  }

  /**
   * Resolve the octave band frequencies, noise limits, and headset attenuation to use for this
   * page, from the response area's `standard` plus any `F`/`MPANL`/`attenuation` overrides. All
   * three must end up the same length; on mismatch, cancels the page and alerts the administrator.
   */
  private resolveConfig(responseArea: MpanlResponseAreaInterface): boolean {
    const standardDefaults = STANDARD_DEFAULTS[this.standard];
    const freqs = responseArea.F ?? standardDefaults.freqs;
    const limits = responseArea.MPANL ?? standardDefaults.limits;
    const attenuation = responseArea.attenuation ?? standardDefaults.wahtsAttenuation;

    if (freqs.length !== limits.length || freqs.length !== attenuation.length) {
      this.cancelExam(
        'The MPANL octave band frequencies, limits, and headset attenuation must all be arrays of equal length (or left unspecified to use the standard defaults). Please verify the protocol and try again.'
      );
      return false;
    }

    freqs.forEach(freq => {
      if (!OCTAVE_BAND_FREQUENCIES.has(freq)) {
        this.notifications
          .alert({
            title: 'Alert',
            content:
              'At least one of the MPANL frequencies specified in the protocol is not an octave band center frequency between 125 and 8,000 Hz. The exam will proceed, but please verify the protocol for accuracy.',
            type: DialogType.Alert,
          })
          .subscribe();
      }
    });

    this.freqs = freqs;
    this.limits = limits;
    this.attenuation = attenuation;
    return true;
  }

  private cancelExam(msg: string): void {
    this.resultsModel.updateCurrentPage({ response: 'cancelled' });
    this.notifications.alert({ title: 'Alert', content: msg, type: DialogType.Alert }).subscribe();
    this.examService.submit();
  }

  async startMeasurement(duration: number): Promise<void> {
    const devices = await this.devicesService.getDeviceOrDefault(this.tabsintId, [DeviceType.Svantek]);
    if (devices.length === 0) {
      this.notifications.alert({ title: 'Alert', content: 'A Svantek dosimeter is not connected.', type: DialogType.Alert }).subscribe();
      return;
    } else if (devices.length >= 2) {
      this.notifications
        .alert({
          title: 'Alert',
          content: 'Multiple Svantek dosimeters are connected and one was not specified. Set `tabsintId` in the protocol to disambiguate.',
          type: DialogType.Alert,
        })
        .subscribe();
      return;
    }
    const candidate = devices[0];
    if (!isSvantekDevice(candidate)) {
      this.logger.error('Resolved device is not a Svantek dosimeter.', candidate);
      return;
    }
    this.device = candidate;

    this.examState = 'recording';
    this.mpanlResults = undefined;
    this.stateModel.updateState({ isSubmittable: false });

    try {
      await this.devicesService.startRecording(this.device);
    } catch (err) {
      this.logger.error('Failed to start recording from the Svantek dosimeter.', err);
      this.notifications
        .alert({ title: 'Alert', content: 'Failed to start recording from the Svantek dosimeter.', type: DialogType.Alert })
        .subscribe();
      this.examState = 'start';
      this.device = undefined;
      return;
    }

    this.recordingTimeout = setTimeout(() => {
      this.finishMeasurement(duration);
    }, duration);
  }

  private async finishMeasurement(duration: number): Promise<void> {
    this.clearRecordingTimeout();
    const device = this.device;
    if (!device) {
      return;
    }

    try {
      await this.devicesService.stopRecording(device);
    } catch (err) {
      this.logger.error('Failed to stop recording from the Svantek dosimeter.', err);
    }
    const svantekResult = this.devicesService.getSvantekResult(device);
    this.device = undefined;

    if (this.isDestroyed) {
      return;
    }

    if (!svantekResult) {
      this.notifications.alert({ title: 'Alert', content: 'No data was received from the Svantek dosimeter.', type: DialogType.Alert }).subscribe();
      this.examState = 'start';
      return;
    }

    const data: MpanlDatumInterface[] = this.freqs.map((freq, i) => {
      const rawLevel = calculateSvantekBandLevel(svantekResult, freq);
      const level = rawLevel !== undefined && rawLevel > 0 ? Math.round(rawLevel * 10) / 10 : 0;
      const levelUnderHeadset = level > 0 && this.attenuation[i] < 1000 ? Math.round((level - this.attenuation[i]) * 10) / 10 : 0;
      return {
        freq,
        level,
        limit: this.limits[i],
        attenuation: this.attenuation[i],
        levelUnderHeadset,
        noiseFloor: NOISE_FLOOR_BY_FREQUENCY[freq],
      };
    });

    this.mpanlResults = { standard: this.standard, duration, data, svantek: svantekResult };
    this.resultsModel.updateCurrentPage({ response: this.mpanlResults });
    this.examState = 'results';

    if (this.autoSubmit) {
      this.examService.submit();
      return;
    }
    this.stateModel.updateState({ isSubmittable: true });
    setTimeout(() => this.createResultsPlot(), 0);
  }

  repeatMeasurement(duration: number): void {
    this.startMeasurement(duration);
  }

  private clearRecordingTimeout(): void {
    if (this.recordingTimeout !== undefined) {
      clearTimeout(this.recordingTimeout);
      this.recordingTimeout = undefined;
    }
  }

  private createResultsPlot(): void {
    if (!this.mpanlResults) {
      return;
    }
    const plot = d3.select('#mpanl-results-plot');
    plot.select('svg').remove();
    if (plot.empty()) {
      return;
    }

    const margin = { top: 20, right: 20, bottom: 60, left: 60 };
    const width = 550 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    const freqs = this.mpanlResults.data.map(d => d.freq);
    const xScale = d3
      .scaleLog()
      .domain([freqs[0] / Math.pow(2, 1 / 3), freqs.at(-1)! * Math.pow(2, 1 / 3)])
      .range([0, width]);
    const yScale = d3.scaleLinear().domain([-10, 80]).range([height, 0]);

    let svg = plot
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    svg = createOAEResultsChartSvg(svg, width, height, freqs, xScale, yScale, 'Frequency (Hz)', 'Level (dB SPL)');

    const measured = this.mpanlResults.data.map(d => d.level);
    const limit = this.mpanlResults.data.map(d => d.limit);
    const underHeadset = this.mpanlResults.data.map(d => d.levelUnderHeadset);

    plotDpoaeSeries(svg, xScale, yScale, freqs, limit, { color: '#d62728', marker: 'X', dashed: true });
    plotDpoaeSeries(svg, xScale, yScale, freqs, measured, { color: '#1f77b4', marker: 'circle' });
    plotDpoaeSeries(svg, xScale, yScale, freqs, underHeadset, { color: '#2ca02c', marker: 'dot' });

    createLegend(
      svg,
      [
        { label: 'Measured level', color: '#1f77b4', symbol: 'circle' },
        { label: 'Level under headset', color: '#2ca02c', symbol: 'dot' },
        { label: 'Limit', color: '#d62728', symbol: 'X', line: '4,3' },
      ],
      width,
      140
    );
  }
}
