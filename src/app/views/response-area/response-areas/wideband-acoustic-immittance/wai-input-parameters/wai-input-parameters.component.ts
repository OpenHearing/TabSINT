import { Component, Input } from '@angular/core';

@Component({
  selector: 'wai-input-parameters',
  templateUrl: './wai-input-parameters.component.html',
  styleUrl: './wai-input-parameters.component.css'
})
export class WAIInputParametersComponent {
  @Input() fStart!: number;
  @Input() fEnd!: number;
  @Input() sweepDuration!: number;
  @Input() sweepType!: string;
  @Input() level!: number;
  @Input() numSweeps!: number;
  @Input() windowDuration!: number;
  @Input() numFrequencies!: number;
  @Input() filename!: string;
  @Input() outputRawMeasurements!: boolean;
}
