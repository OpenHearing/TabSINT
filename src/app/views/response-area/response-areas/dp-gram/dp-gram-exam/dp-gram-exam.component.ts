import { Component } from '@angular/core';
import * as d3 from 'd3';

import { DpoaeExamBaseComponent } from '../../shared/dpoae/dpoae-exam-base.component';
import { DpGramInterface, DpGramResultsInterface } from './dp-gram-exam.interface';
import { dpGramSchema } from '../../../../../../schema/response-areas/dp-gram.schema';

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

    // Update xTicks and scales - matches Swept DPOAE's approach: standard octave ticks filtered
    // to the tested frequency range, domain spanning that range.
    const sortedF2 = [...this.f2].sort((a, b) => a - b);
    if (sortedF2.length > 0) {
      const f2Min = sortedF2[0];
      const f2Max = sortedF2[sortedF2.length - 1];
      this.xTicks = [125, 250, 500, 1000, 2000, 4000, 8000, 16000].filter(tick => tick >= f2Min && tick <= f2Max);
      this.xScale = d3.scaleLog().domain([f2Min, f2Max]).range([0, this.width]);
    }

    this.yScale = d3.scaleLinear().domain([-20, 70]).range([this.height, 0]);
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
