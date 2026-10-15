import { Component, Input } from '@angular/core';
import { GapResultsInterface } from '../gap.interface';
import { buildGapProgressionData } from '../gap.utility';
import { TrialProgressionPlotDataInterface } from '../../shared/trial-progression-plot/trial-progression-plot.interface';

/**
 * Stored-result view for a gap exam: the same trial-progression plot shown at the end of the exam.
 */
@Component({
  selector: 'app-gap-results',
  templateUrl: './gap-results.component.html',
})
export class GapResultsComponent {
  @Input() results!: GapResultsInterface;

  private cachedResults?: GapResultsInterface;
  private cachedData?: TrialProgressionPlotDataInterface;

  /** Plot data, rebuilt only when the results object changes so the plot input stays stable. */
  get plotData(): TrialProgressionPlotDataInterface {
    if (this.cachedResults !== this.results || !this.cachedData) {
      this.cachedResults = this.results;
      this.cachedData = buildGapProgressionData(this.results ?? {});
    }
    return this.cachedData;
  }
}
