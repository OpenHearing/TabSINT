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

/** Bar is colored red/yellow/green depending how close the estimated level under the headset is to the standard's limit. */
const WITHIN_LIMIT_BAND_DB = 3;

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

  /**
   * Bar chart of estimated background noise level under the headset, one bar per octave band,
   * colored by how it compares to that band's limit. Overlaid with a gray tick at the limit and a
   * black tick at the dosimeter's own noise floor (referenced under the headset, i.e. floor minus
   * attenuation). Ported from legacy TabSInt's `mpanlsPlot` (cha-plot.js).
   */
  private createResultsPlot(): void {
    if (!this.mpanlResults) {
      return;
    }
    const plot = d3.select('#mpanl-results-plot');
    plot.select('svg').remove();
    if (plot.empty()) {
      return;
    }

    const data = this.mpanlResults.data;
    const freqs = data.map(d => d.freq);

    const margin = { top: 20, right: 170, bottom: 60, left: 60 };
    const width = 400;
    const height = 350;

    const yTicks = [-10, 0, 10, 20, 30, 40, 50, 60];
    const xScale = d3
      .scaleBand<number>()
      .range([-15, width + 15])
      .domain(freqs)
      .padding(0.2);
    const yScale = d3.scaleLinear().domain([-10, 80]).range([height, 0]);
    const xLog = d3
      .scaleLog()
      .base(2)
      .domain([freqs[0] / Math.pow(2, 1 / 3), Math.pow(2, 1 / 3) * freqs.at(-1)!])
      .range([0, width]);

    const svg = plot
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    svg
      .selectAll('.mpanl-bar')
      .data(data)
      .enter()
      .append('rect')
      .attr('x', d => xScale(d.freq)!)
      .attr('y', d => yScale(d.levelUnderHeadset))
      .attr('width', xScale.bandwidth())
      .attr('height', d => height - yScale(d.levelUnderHeadset))
      .attr('stroke', 'black')
      .attr('fill', d => {
        if (d.levelUnderHeadset > d.limit + WITHIN_LIMIT_BAND_DB) return '#FF6347';
        if (d.levelUnderHeadset > d.limit - WITHIN_LIMIT_BAND_DB) return 'yellow';
        return '#00FF7F';
      });

    svg
      .selectAll('.mpanl-limit-tick')
      .data(data)
      .enter()
      .append('rect')
      .attr('x', d => xScale(d.freq)! - 3)
      .attr('y', d => yScale(d.limit))
      .attr('width', xScale.bandwidth() + 6)
      .attr('height', 6)
      .attr('stroke', 'black')
      .attr('fill', 'rgb(150, 150, 150)');

    svg
      .selectAll('.mpanl-noise-floor-tick')
      .data(data)
      .enter()
      .append('rect')
      .attr('x', d => xScale(d.freq)! - 3)
      .attr('y', d => yScale((d.noiseFloor ?? 0) - d.attenuation))
      .attr('width', xScale.bandwidth() + 6)
      .attr('height', 2)
      .attr('stroke', 'black')
      .attr('fill', 'black');

    svg
      .append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(xLog).tickValues(freqs).tickSize(10).tickFormat(d3.format('d')));

    svg.append('g').call(d3.axisLeft(yScale).tickValues(yTicks).tickSizeInner(10).tickSizeOuter(0));

    svg
      .append('text')
      .attr('x', width / 2)
      .attr('y', height + 45)
      .attr('text-anchor', 'middle')
      .text('Frequency (Hz)');

    svg
      .append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -height / 2)
      .attr('y', -45)
      .attr('text-anchor', 'middle')
      .text('Estimated Level Under the Earcup (dB SPL)');

    const legendData = [
      { text: 'Below Limit', color: '#00FF7F' },
      { text: 'Within 3 dB SPL of Limit', color: 'yellow' },
      { text: 'Above Limit', color: '#FF6347' },
      { text: 'Limit', color: 'rgb(150, 150, 150)' },
      { text: 'Dosimeter Noise Floor', color: 'black' },
    ];

    const legend = svg.append('g').attr('transform', `translate(${width + 15}, 10)`);

    legend
      .selectAll('rect')
      .data(legendData)
      .enter()
      .append('rect')
      .attr('x', 0)
      .attr('y', (_d, i) => i * 22)
      .attr('width', 12)
      .attr('height', 12)
      .style('fill', d => d.color)
      .style('stroke', 'black');

    legend
      .selectAll('text')
      .data(legendData)
      .enter()
      .append('text')
      .attr('x', 16)
      .attr('y', (_d, i) => i * 22 + 10)
      .attr('font-size', 11)
      .text(d => d.text);
  }
}
