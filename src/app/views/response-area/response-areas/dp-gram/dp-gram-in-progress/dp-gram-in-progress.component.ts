import { Component, Input } from '@angular/core';
import * as d3 from 'd3';

import { DpoaeInProgressBaseComponent } from '../../shared/dpoae/dpoae-in-progress-base.component';
import { DPOAEDataInterface, DpGramResultsInterface } from '../dp-gram-exam/dp-gram-exam.interface';
import { createLegend, createOAEResultsChartSvg, plotOAEPointMarkers } from '../../../../../utilities/d3-plot-functions';
import { getCurrentDatetime, handleOutputCalibration } from '../../../../../utilities/exam-helper-functions';

@Component({
  selector: 'app-dp-gram-in-progress',
  templateUrl: './dp-gram-in-progress.component.html',
  styleUrl: './dp-gram-in-progress.component.css',
})
export class DpGramInProgressComponent extends DpoaeInProgressBaseComponent<DpGramResultsInterface> {
  protected readonly examLabel = 'DP-gram';

  // MinSweeps/MaxSweeps are fixed at 1: for a single-point (F2Start === F2End) measurement,
  // repeated averaging comes from overlapping analysis windows within one sweep (see
  // buildExamProperties), not from repeated sweeps.
  private static readonly SINGLE_POINT_MIN_SWEEPS = 1;
  private static readonly SINGLE_POINT_MAX_SWEEPS = 1;

  /** Reference pressure for dB SPL, in Pascals (20 micropascals). */
  private static readonly REFERENCE_PRESSURE_PA = 20e-6;

  @Input() xScale!: d3.ScaleLogarithmic<number, number, never>;
  @Input() f2: number[] = [];
  @Input() outputChannel1!: string;
  @Input() outputChannel2!: string;
  @Input() inputChannel!: string;
  @Input() outputCalibrationType!: string;
  @Input() ratio!: number;
  @Input() windowDuration!: number;
  @Input() minTestAverages!: number;
  @Input() maxTestAverages!: number;
  @Input() l1!: number;
  @Input() l2!: number;
  @Input() noiseFloorThreshold!: number;
  @Input() SNRThreshold!: number;
  @Input() outputRawMeasurements!: boolean;
  @Input() recordFileFolder: string | undefined;

  /** Results merged across every f2 frequency completed so far. */
  private accumulated: DpGramResultsInterface = { State: 'BUSY', PctComplete: 0 };

  protected override startPolling(): void {
    this.runFrequencyLoop();
  }

  protected createProgressPlot(yScale: d3.ScaleLinear<number, number, never>) {
    const plot = d3.select('#dp-gram-in-progress-plot');
    plot.select('svg').remove(); // Remove existing svg in case of update
    let svg = plot
      .append('svg')
      .attr('width', this.width + this.margin.left + this.margin.right)
      .attr('height', this.height + this.margin.top + this.margin.bottom)
      .append('g')
      .attr('transform', `translate(${this.margin.left},${this.margin.top})`);

    svg = createOAEResultsChartSvg(svg, this.width, this.height, this.xTicks, this.xScale, yScale);

    const legendData = [
      { label: 'DPOAE', color: 'blue', symbol: 'circle' },
      { label: 'NF', color: 'red', symbol: 'X' },
    ];

    createLegend(svg, legendData, this.width, 85);

    return svg;
  }

  protected onResultsUpdate(results: DpGramResultsInterface): void {
    if (results.DpLow && results.F2) {
      this.updatePlot(results.DpLow, results.F2);
    }
  }

  /**
   * Loops through every f2 frequency in order: queues a single-point SweptDPOAE exam
   * (F2Start === F2End === freq), polls it to completion, merges the one-point result into the
   * running accumulated results, and updates the live plot - before moving to the next frequency.
   * Stops early (keeping whatever frequencies already completed) if aborted.
   */
  private async runFrequencyLoop(): Promise<void> {
    const total = this.f2.length;
    for (let i = 0; i < total && !this.shouldAbort; i++) {
      const freq = this.f2[i];
      await this.devicesService.queueExam(this.device!, 'SweptDPOAE', this.buildExamProperties(freq, i));
      if (this.shouldAbort) break;

      const finalRaw = await this.pollSingleExamResult(raw => {
        const overallPct = ((i + (raw.PctComplete ?? 0) / 100) / total) * 100;
        this.inProgressResultsSubject.next({ ...this.accumulated, State: 'BUSY', PctComplete: overallPct });
      });
      if (this.shouldAbort) break;

      this.mergeFrequencyResult(finalRaw);
      this.accumulated.PctComplete = ((i + 1) / total) * 100;
      this.inProgressResultsSubject.next({ ...this.accumulated });
    }

    if (!this.shouldAbort) {
      this.accumulated.State = 'DONE';
      this.accumulated.PctComplete = 100;
      this.inProgressResultsSubject.next({ ...this.accumulated });
      this.stateModel.updateState({ isSubmittable: true });
      this.resultsEvent.emit(this.accumulated);
      this.instructions = "Exam complete, press 'Next' to continue.";
      this.changeDetectorRef.detectChanges();
    }
  }

  /**
   * Polls requestResults until the current single-frequency exam reports State 'DONE', calling
   * onTick with every valid intermediate response so the caller can derive overall progress.
   */
  private async pollSingleExamResult(onTick: (raw: DpGramResultsInterface) => void): Promise<DpGramResultsInterface> {
    return new Promise<DpGramResultsInterface>(resolve => {
      const poll = async () => {
        if (this.shouldAbort) {
          resolve(this.inProgressResults);
          return;
        }

        this.isRequestingResults = true;
        const resp = await this.devicesService.requestResults(this.device!);
        this.isRequestingResults = false;

        if (this.shouldAbort) {
          resolve(this.inProgressResults);
          return;
        }

        if (this.doesRespContainResults(resp)) {
          const raw = resp?.msg[1] as DpGramResultsInterface;
          onTick(raw);
          if (raw.State === 'DONE') {
            resolve(raw);
            return;
          }
        } else {
          this.logger.debug(
            `${this.examLabel} in-progress component. Request results did not return expected results. It may be too early to receive results.`
          );
        }

        setTimeout(poll, 1000);
      };

      poll();
    });
  }

  private buildExamProperties(freq: number, index: number): object {
    // 50% overlap between successive analysis windows: NumFrequencies windows span
    // MaxTestAverages window-widths of the sweep.
    const sweepDuration = this.maxTestAverages * this.windowDuration;
    const numFrequencies = 2 * this.maxTestAverages - 1;

    const examProperties: any = {
      OutputChannel1: handleOutputCalibration(this.outputChannel1, this.outputCalibrationType),
      OutputChannel2: handleOutputCalibration(this.outputChannel2, this.outputCalibrationType),
      InputChannel: this.inputChannel,
      F2Start: freq,
      F2End: freq,
      Ratio: this.ratio,
      SweepDuration: sweepDuration,
      SweepType: 'log',
      WindowDuration: this.windowDuration,
      MinSweeps: DpGramInProgressComponent.SINGLE_POINT_MIN_SWEEPS,
      MaxSweeps: DpGramInProgressComponent.SINGLE_POINT_MAX_SWEEPS,
      NumFrequencies: numFrequencies,
      L1: this.l1,
      L2: this.l2,
      NoiseFloorThreshold: this.noiseFloorThreshold,
      SNRThreshold: this.SNRThreshold,
      OutputRawMeasurements: this.outputRawMeasurements,
    };
    if (this.recordFileFolder != undefined) {
      examProperties['Filename'] = `${this.recordFileFolder}/${getCurrentDatetime()}_f2-${index}-${freq}Hz.WAV`;
    }
    return examProperties;
  }

  private mergeFrequencyResult(raw: DpGramResultsInterface): void {
    this.accumulated.NumPoints = (this.accumulated.NumPoints ?? 0) + 1;
    this.accumulated.DpLow = this.appendAggregatedPoint(this.accumulated.DpLow, raw.DpLow);
    this.accumulated.DpHigh = this.appendAggregatedPoint(this.accumulated.DpHigh, raw.DpHigh);
    this.accumulated.F1 = this.appendAggregatedPoint(this.accumulated.F1, raw.F1);
    this.accumulated.F2 = this.appendAggregatedPoint(this.accumulated.F2, raw.F2);
    if (raw.Raw) {
      this.accumulated.Raw = this.accumulated.Raw ?? {};
      this.accumulated.Raw.DpLow = this.appendRawWindows(this.accumulated.Raw.DpLow, raw.Raw.DpLow);
      this.accumulated.Raw.DpHigh = this.appendRawWindows(this.accumulated.Raw.DpHigh, raw.Raw.DpHigh);
      this.accumulated.Raw.F1 = this.appendRawWindows(this.accumulated.Raw.F1, raw.Raw.F1);
      this.accumulated.Raw.F2 = this.appendRawWindows(this.accumulated.Raw.F2, raw.Raw.F2);
    }
  }

  /**
   * Appends one aggregated point onto target, creating target if necessary. Source holds
   * NumFrequencies raw overlapping-window samples of the same nominal frequency (from the
   * single-point SweptDPOAE exam) - these are coherently (complex) averaged into one
   * amplitude/phase pair, and the noise floor is aggregated to match, rather than just reading
   * off a single raw sample.
   */
  private appendAggregatedPoint(target: DPOAEDataInterface | undefined, source: DPOAEDataInterface | undefined): DPOAEDataInterface | undefined {
    if (!source) return target;
    const next: DPOAEDataInterface = target ?? { Frequency: [], Amplitude: [], Phase: [] };
    const { amplitudeDB, phaseRad } = DpGramInProgressComponent.complexAverageMagnitude(source.Amplitude, source.Phase);
    next.Frequency.push(source.Frequency[0]);
    next.Amplitude.push(amplitudeDB);
    next.Phase.push(phaseRad);
    if (source.NoiseFloor) {
      next.NoiseFloor = next.NoiseFloor ?? [];
      next.NoiseFloor.push(DpGramInProgressComponent.aggregateNoiseFloor(source.NoiseFloor));
    }
    return next;
  }

  /**
   * Coherently (complex/vector) average NumFrequencies overlapping-window samples of the same
   * nominal frequency into a single amplitude (dB SPL) / phase (radians) pair. Averaging happens
   * in the linear complex domain (Pascals) rather than naively averaging dB values, since dB
   * magnitudes alone discard the phase information needed to average out incoherent noise.
   */
  private static complexAverageMagnitude(amplitudeDB: number[], phaseRad: number[]): { amplitudeDB: number; phaseRad: number } {
    let sumReal = 0;
    let sumImag = 0;
    for (let i = 0; i < amplitudeDB.length; i++) {
      const magnitudePa = DpGramInProgressComponent.REFERENCE_PRESSURE_PA * 10 ** (amplitudeDB[i] / 20);
      sumReal += magnitudePa * Math.cos(phaseRad[i]);
      sumImag += magnitudePa * Math.sin(phaseRad[i]);
    }
    const meanReal = sumReal / amplitudeDB.length;
    const meanImag = sumImag / amplitudeDB.length;
    return {
      amplitudeDB: 20 * Math.log10(Math.hypot(meanReal, meanImag) / DpGramInProgressComponent.REFERENCE_PRESSURE_PA),
      phaseRad: Math.atan2(meanImag, meanReal),
    };
  }

  /**
   * Aggregate per-window noise floor samples (dB) into the noise floor of the coherently
   * averaged signal computed by complexAverageMagnitude. Adjacent windows overlap 50% and are
   * therefore not statistically independent, so only every other sample is used; the summed
   * power is divided by n^2 (not n) to match the variance reduction of coherently averaging n
   * independent complex samples.
   */
  private static aggregateNoiseFloor(noiseFloorDB: number[]): number {
    const independentPowerPa2 = noiseFloorDB
      .filter((_, i) => i % 2 === 0)
      .map(db => (DpGramInProgressComponent.REFERENCE_PRESSURE_PA * 10 ** (db / 20)) ** 2);
    const n = independentPowerPa2.length;
    const meanPowerPa2 = independentPowerPa2.reduce((sum, power) => sum + power, 0) / (n * n);
    return 20 * Math.log10(Math.sqrt(meanPowerPa2) / DpGramInProgressComponent.REFERENCE_PRESSURE_PA);
  }

  /**
   * Appends all of source's raw windows onto target, creating target if necessary. Unlike
   * appendAggregatedPoint, nothing is combined or discarded here - Raw is meant to preserve every
   * individual raw window measurement (across every f2 frequency) for later export/analysis.
   */
  private appendRawWindows(target: DPOAEDataInterface | undefined, source: DPOAEDataInterface | undefined): DPOAEDataInterface | undefined {
    if (!source) return target;
    const next: DPOAEDataInterface = target ?? { Frequency: [], Amplitude: [], Phase: [] };
    next.Frequency.push(...source.Frequency);
    next.Amplitude.push(...source.Amplitude);
    next.Phase.push(...source.Phase);
    if (source.NoiseFloor) {
      next.NoiseFloor = next.NoiseFloor ?? [];
      next.NoiseFloor.push(...source.NoiseFloor);
    }
    return next;
  }

  private updatePlot(dpLowData: DPOAEDataInterface, f2Data: DPOAEDataInterface) {
    const filteredData = this.filterData(dpLowData, f2Data);

    // Re-create the plot with expanding Y scale
    const yDomainLower = Math.min(...this.yScale.domain());
    const yDomainUpper = Math.max(...this.yScale.domain());
    const newMin = Math.min(yDomainLower, ...filteredData['Amplitude'], ...filteredData['NoiseFloor']);
    const newMax = Math.max(yDomainUpper, ...filteredData['Amplitude'], ...filteredData['NoiseFloor']);
    const extendedYScale = this.yScale.copy();
    extendedYScale.domain([newMin, newMax]);
    this.svg = this.createProgressPlot(extendedYScale);

    plotOAEPointMarkers(this.svg, this.xScale, extendedYScale, filteredData['F2Frequency'], filteredData['Amplitude'], filteredData['NoiseFloor']);
  }

  private filterData(dpLowData: DPOAEDataInterface, f2Data: DPOAEDataInterface) {
    const filteredData: Record<string, number[]> = {
      Frequency: [],
      F2Frequency: [],
      Amplitude: [],
      NoiseFloor: [],
    };
    for (let i = 0; i < dpLowData.Frequency.length; i++) {
      const freq = dpLowData.Frequency[i];
      filteredData['Frequency'].push(freq);
      filteredData['F2Frequency'].push(f2Data.Frequency[i]);
      filteredData['Amplitude'].push(dpLowData.Amplitude[i]);
      if (dpLowData['NoiseFloor'] && filteredData['NoiseFloor']) {
        filteredData['NoiseFloor'].push(dpLowData.NoiseFloor[i]);
      }
    }
    return filteredData;
  }
}
