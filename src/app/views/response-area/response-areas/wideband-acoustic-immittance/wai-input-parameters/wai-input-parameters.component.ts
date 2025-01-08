import { Component, Input } from '@angular/core';
import { waiSchema } from '../../../../../../schema/response-areas/wai.schema';

@Component({
  selector: 'wai-input-parameters',
  templateUrl: './wai-input-parameters.component.html',
  styleUrl: './wai-input-parameters.component.css'
})
export class WAIInputParametersComponent {
  @Input() f2Start: number = waiSchema.properties.f2Start.default;
  @Input() f2End: number = waiSchema.properties.f2End.default;
  @Input() frequencyRatio: number = waiSchema.properties.frequencyRatio.default;
  @Input() sweepDuration: number = waiSchema.properties.sweepDuration.default;
  @Input() windowDuration: number = waiSchema.properties.windowDuration.default;
  @Input() sweepType: number = waiSchema.properties.sweepType.default;
  @Input() minSweeps: number = waiSchema.properties.minSweeps.default;
  @Input() maxSweeps: number = waiSchema.properties.maxSweeps.default;
  @Input() noiseFloorThreshold: number = waiSchema.properties.noiseFloorThreshold.default;
}
