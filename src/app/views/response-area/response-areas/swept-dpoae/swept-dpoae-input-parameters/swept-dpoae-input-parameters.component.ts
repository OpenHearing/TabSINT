import { Component, Input } from '@angular/core';

@Component({
  selector: 'swept-dpoae-input-parameters',
  templateUrl: './swept-dpoae-input-parameters.component.html',
  styleUrl: './swept-dpoae-input-parameters.component.css'
})
export class SweptDpoaeInputParametersComponent {
  @Input() f2Start!: number;
  @Input() f2End!: number;
  @Input() frequencyRatio!: number;
  @Input() sweepDuration!: number;
  @Input() windowDuration!: number;
  @Input() sweepType!: string;
  @Input() minSweeps!: number;
  @Input() maxSweeps!: number;
  @Input() noiseFloorThreshold!: number;
}
