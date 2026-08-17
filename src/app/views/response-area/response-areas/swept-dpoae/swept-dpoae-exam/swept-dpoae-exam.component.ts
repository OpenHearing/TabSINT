import { Component } from '@angular/core';
import * as d3 from 'd3';

import { DpoaeExamBaseComponent } from '../../shared/dpoae/dpoae-exam-base.component';
import { DPOAE_Y_AXIS_DOMAIN } from '../../shared/dpoae/dpoae-common.interface';
import { SweptDpoaeInterface, SweptDpoaeResultsInterface } from './swept-dpoae-exam.interface';
import { sweptDpoaeSchema } from '../../../../../../schema/response-areas/swept-dpoae.schema';
import { handleOutputCalibration, getCurrentDatetime } from '../../../../../utilities/exam-helper-functions';

@Component({
  selector: 'app-swept-dpoae-exam',
  templateUrl: './swept-dpoae-exam.component.html',
  styleUrl: './swept-dpoae-exam.component.css',
})
export class SweptDpoaeExamComponent extends DpoaeExamBaseComponent<SweptDpoaeInterface, SweptDpoaeResultsInterface> {
  protected readonly responseAreaType = 'sweptDPOAEResponseArea';
  protected readonly examLabel = 'Swept DPOAE';

  f2Start: number = sweptDpoaeSchema.properties.f2Start.default;
  f2End: number = sweptDpoaeSchema.properties.f2End.default;
  sweepDuration: number = sweptDpoaeSchema.properties.sweepDuration.default;
  sweepType: 'log' | 'linear' = sweptDpoaeSchema.properties.sweepType.default;
  minSweeps: number = sweptDpoaeSchema.properties.minSweeps.default;
  maxSweeps: number = sweptDpoaeSchema.properties.maxSweeps.default;
  windowDuration: number = sweptDpoaeSchema.properties.windowDuration.default;
  numFrequencies: number = sweptDpoaeSchema.properties.numFrequencies.default;

  // Set default dimensions and margins
  xTicks = [125, 250, 500, 1000, 2000, 4000, 8000, 16000];
  xScale = d3.scaleLog();
  yScale = d3.scaleLinear();

  constructor() {
    super(sweptDpoaeSchema.properties);
  }

  protected applyResponseArea(responseArea: SweptDpoaeInterface): void {
    this.applyCommonFields(responseArea);
    this.f2Start = responseArea.f2Start ?? this.f2Start;
    this.f2End = responseArea.f2End ?? this.f2End;
    this.sweepDuration = responseArea.sweepDuration ?? this.sweepDuration;
    this.sweepType = responseArea.sweepType ?? this.sweepType;
    this.minSweeps = responseArea.minSweeps ?? this.minSweeps;
    this.maxSweeps = responseArea.maxSweeps ?? this.maxSweeps;
    this.windowDuration = responseArea.windowDuration ?? this.windowDuration;
    this.numFrequencies = responseArea.numFrequencies ?? this.numFrequencies;

    this.inputParameterMap = new Map([
      ['Start Frequency [Hz]', this.f2Start.toString()],
      ['End Frequency [Hz]', this.f2End.toString()],
      ['Ratio', this.ratio.toString()],
      ['Sweep Duration [s]', this.sweepDuration.toString()],
      ['Window Duration [s]', this.windowDuration.toString()],
      ['Sweep Type', this.sweepType.toString()],
      ['Minimum Num Sweeps', this.minSweeps.toString()],
      ['Maximum Num Sweeps', this.maxSweeps.toString()],
      ['Noise Floor Threshold', this.noiseFloorThreshold.toString()],
    ]);

    // Update xTicks and scales
    this.xTicks = [125, 250, 500, 1000, 2000, 4000, 8000, 16000].filter(tick => tick >= this.f2Start && tick <= this.f2End);
    this.xScale = d3.scaleLog().domain([this.f2Start, this.f2End]).range([0, this.width]);

    this.yScale = d3.scaleLinear().domain(DPOAE_Y_AXIS_DOMAIN).range([this.height, 0]);
  }

  protected async beginExam(): Promise<void> {
    this.device = await this.resolveDevice();
    if (this.device) {
      const examProperties: any = {
        OutputChannel1: handleOutputCalibration(this.outputChannel1, this.outputCalibrationType),
        OutputChannel2: handleOutputCalibration(this.outputChannel2, this.outputCalibrationType),
        InputChannel: this.inputChannel,
        F2Start: this.f2Start,
        F2End: this.f2End,
        Ratio: this.ratio,
        SweepDuration: this.sweepDuration,
        SweepType: this.sweepType,
        L1: this.l1,
        L2: this.l2,
        MinSweeps: this.minSweeps,
        MaxSweeps: this.maxSweeps,
        NoiseFloorThreshold: this.noiseFloorThreshold,
        SNRThreshold: this.SNRThreshold,
        WindowDuration: this.windowDuration,
        NumFrequencies: this.numFrequencies,
        OutputRawMeasurements: this.outputRawMeasurements,
      };
      if (this.recordFileFolder != undefined) {
        examProperties['Filename'] = this.recordFileFolder + '/' + getCurrentDatetime() + '.WAV';
      }
      await this.devicesService.queueExam(this.device, 'SweptDPOAE', examProperties);
    }
  }
}
