import { Component, Input } from '@angular/core';
import { sweptOaeSchema } from '../../../../../../schema/response-areas/swept-oae.schema';

@Component({
  selector: 'swept-oae-input-parameters',
  templateUrl: './swept-oae-input-parameters.component.html',
  styleUrl: './swept-oae-input-parameters.component.css'
})
export class SweptOaeInputParametersComponent {
  @Input() f2Start: number = sweptOaeSchema.properties.f2Start.default;
  @Input() f2End: number = sweptOaeSchema.properties.f2End.default;
  @Input() frequencyRatio: number = sweptOaeSchema.properties.frequencyRatio.default;
  @Input() sweepDuration: number = sweptOaeSchema.properties.sweepDuration.default;
  @Input() windowDuration: number = sweptOaeSchema.properties.windowDuration.default;
  @Input() sweepType: number = sweptOaeSchema.properties.sweepType.default;
  @Input() minSweeps: number = sweptOaeSchema.properties.minSweeps.default;
  @Input() maxSweeps: number = sweptOaeSchema.properties.maxSweeps.default;
  @Input() noiseFloorThreshold: number = sweptOaeSchema.properties.noiseFloorThreshold.default;
}
