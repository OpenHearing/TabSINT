import { Component } from '@angular/core';
import * as d3 from 'd3';

import { DpoaeExamBaseComponent } from '../../shared/dpoae/dpoae-exam-base.component';
import { DPOAE_Y_AXIS_DOMAIN } from '../../shared/dpoae/dpoae-common.interface';
import { DpGramInterface, DpGramResultsInterface } from './dp-gram-exam.interface';
import { dpGramSchema } from '../../../../../../schema/response-areas/dp-gram.schema';

@Component({
  selector: 'app-dp-gram-exam',
  templateUrl: './dp-gram-exam.component.html',
})
export class DpGramExamComponent extends DpoaeExamBaseComponent<DpGramInterface, DpGramResultsInterface> {
  protected readonly responseAreaType = 'dpGramResponseArea';
  protected readonly examLabel = 'DP-gram';

  // f2 is required (no schema default) - protocols must always supply the frequency list.
  f2: number[] = [];
  windowDuration: number = dpGramSchema.properties.windowDuration.default;
  minTestAverages: number = dpGramSchema.properties.minTestAverages.default;
  maxTestAverages: number = dpGramSchema.properties.maxTestAverages.default;
  ear: DpGramInterface['ear'];

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
    this.windowDuration = responseArea.windowDuration ?? this.windowDuration;
    this.minTestAverages = responseArea.minTestAverages ?? this.minTestAverages;
    this.maxTestAverages = responseArea.maxTestAverages ?? this.maxTestAverages;
    this.ear = responseArea.ear ?? this.ear;

    this.inputParameterMap = new Map([
      ['F2 Frequencies [Hz]', this.f2.join(', ')],
      ['Ratio', this.ratio.toString()],
      ['L1 [dB]', this.l1.toString()],
      ['L2 [dB]', this.l2.toString()],
      ['Noise Floor Threshold', this.noiseFloorThreshold.toString()],
    ]);

    // Update xTicks and scales - unlike Swept DPOAE's continuous sweep, DP-gram tests a handful
    // of discrete f2 frequencies, so ticks sit exactly at the tested frequencies.
    const sortedF2 = [...this.f2].sort((a, b) => a - b);
    if (sortedF2.length > 0) {
      const f2Min = sortedF2[0];
      const f2Max = sortedF2.at(-1)!;
      this.xTicks = sortedF2;
      this.xScale = d3.scaleLog().domain([f2Min, f2Max]).range([0, this.width]);
    }

    this.yScale = d3.scaleLinear().domain(DPOAE_Y_AXIS_DOMAIN).range([this.height, 0]);
  }

  /**
   * DP-gram queues one SweptDPOAE exam per f2 frequency (rather than one exam for the whole
   * response area), so the actual queueExam calls happen inside DpGramInProgressComponent's own
   * frequency loop. This just resolves the device, matching every other DPOAE response area.
   */
  protected async beginExam(): Promise<void> {
    this.device = await this.resolveDevice();
  }
}
