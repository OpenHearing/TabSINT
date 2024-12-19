import { Component, Input } from '@angular/core';
import { sweptDpoaeSchema } from '../../../../../../schema/response-areas/swept-dpoae.schema';

@Component({
  selector: 'swept-dpoae-input-parameters',
  templateUrl: './swept-dpoae-input-parameters.component.html',
  styleUrl: './swept-dpoae-input-parameters.component.css'
})
export class SweptDpoaeInputParametersComponent {
  @Input() f2Start: number = sweptDpoaeSchema.properties.f2Start.default;
  @Input() f2End: number = sweptDpoaeSchema.properties.f2End.default;
  @Input() frequencyRatio: number = sweptDpoaeSchema.properties.frequencyRatio.default;
  @Input() sweepDuration: number = sweptDpoaeSchema.properties.sweepDuration.default;
  @Input() windowDuration: number = sweptDpoaeSchema.properties.windowDuration.default;
  @Input() sweepType: number = sweptDpoaeSchema.properties.sweepType.default;
  @Input() minSweeps: number = sweptDpoaeSchema.properties.minSweeps.default;
  @Input() maxSweeps: number = sweptDpoaeSchema.properties.maxSweeps.default;
  @Input() noiseFloorThreshold: number = sweptDpoaeSchema.properties.noiseFloorThreshold.default;
}
