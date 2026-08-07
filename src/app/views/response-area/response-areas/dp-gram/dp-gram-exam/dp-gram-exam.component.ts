import { Component } from '@angular/core';
import * as d3 from 'd3';

import { DpoaeExamBaseComponent } from '../../shared/dpoae/dpoae-exam-base.component';
import { DpGramInterface, DpGramResultsInterface } from './dp-gram-exam.interface';
import { dpGramSchema } from '../../../../../../schema/response-areas/dp-gram.schema';
import { handleOutputCalibration, getCurrentDatetime } from '../../../../../utilities/exam-helper-functions';

@Component({
  selector: 'app-dp-gram-exam',
  templateUrl: './dp-gram-exam.component.html',
  styleUrl: './dp-gram-exam.component.css',
})
export class DpGramExamComponent extends DpoaeExamBaseComponent<DpGramInterface, DpGramResultsInterface> {
  protected readonly responseAreaType = 'dpGramResponseArea';
  protected readonly examLabel = 'DP-gram';

  // f2 is required (no schema default) - protocols must always supply the frequency list.
  f2: number[] = [];
  // TODO: unconfirmed against firmware - name/default placeholder.
  numAverages: number = dpGramSchema.properties.numAverages.default;

  // Set default dimensions and margins
  xTicks: number[] = [];
  xScale = d3.scaleLog();
  yScale = d3.scaleLinear();

  constructor() {
    super(dpGramSchema.properties);
  }

  protected applyResponseArea(responseArea: DpGramInterface): void {
    this.applyCommonFields(responseArea);
    this.f2 = responseArea.f2 ?? this.f2;
    this.numAverages = responseArea.numAverages ?? this.numAverages;

    this.inputParameterMap = new Map([
      ['F2 Frequencies [Hz]', this.f2.join(', ')],
      ['Ratio', this.ratio.toString()],
      ['L1 [dB]', this.l1.toString()],
      ['L2 [dB]', this.l2.toString()],
      ['Noise Floor Threshold', this.noiseFloorThreshold.toString()],
    ]);

    // Update xTicks and scales - every tested frequency gets its own labeled tick, since DP-gram
    // tests discrete frequencies rather than sweeping continuously between them.
    const sortedF2 = [...this.f2].sort((a, b) => a - b);
    this.xTicks = sortedF2;
    if (sortedF2.length > 0) {
      this.xScale = d3
        .scaleLog()
        .domain([sortedF2[0], sortedF2[sortedF2.length - 1]])
        .range([0, this.width]);
    }

    this.yScale = d3.scaleLinear().domain([-20, 70]).range([this.height, 0]);
  }

  protected async beginExam(): Promise<void> {
    this.device = await this.resolveDevice();
    if (this.device) {
      const examProperties: any = {
        OutputChannel1: handleOutputCalibration(this.outputChannel1, this.outputCalibrationType),
        OutputChannel2: handleOutputCalibration(this.outputChannel2, this.outputCalibrationType),
        InputChannel: this.inputChannel,
        F2: this.f2,
        Ratio: this.ratio,
        L1: this.l1,
        L2: this.l2,
        NoiseFloorThreshold: this.noiseFloorThreshold,
        SNRThreshold: this.SNRThreshold,
        NumAverages: this.numAverages,
        OutputRawMeasurements: this.outputRawMeasurements,
      };
      if (this.recordFileFolder != undefined) {
        examProperties['Filename'] = this.recordFileFolder + '/' + getCurrentDatetime() + '.WAV';
      }
      // TODO: device exam command name and examProperties field casing are unconfirmed against
      // real DP-gram firmware - placeholder mirroring swept's PascalCase convention.
      await this.devicesService.queueExam(this.device, 'DPGram', examProperties);
    }
  }
}
