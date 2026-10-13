import { Component, Input } from '@angular/core';

import { AudiometryResultsInterface } from '../../../../../../interfaces/audiometry-results.interface';

/**
 * Pairs app-audiogram with app-audiometry-results-table for a given AudiometryResultsInterface.
 */
@Component({
  selector: 'app-audiometry-combined-results',
  templateUrl: './audiometry-combined-results.component.html',
})
export class AudiometryCombinedResultsComponent {
  @Input() dataStruct!: AudiometryResultsInterface;
  @Input() showLegend = true;
}
