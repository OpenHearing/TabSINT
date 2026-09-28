import { Component, Input } from '@angular/core';

import { buildSnrProgressionPlotData } from '../../../../../utilities/build-snr-progression-plot.function';
import { TrialProgressionPlotDataInterface } from '../../shared/trial-progression-plot/trial-progression-plot.interface';
import { HintExamSummaryInterface, HintPresentationResultInterface } from '../hint.interface';

@Component({
  selector: 'app-hint-results',
  templateUrl: './hint-results.component.html',
  styleUrl: './hint-results.component.css',
})
export class HintResultsComponent {
  @Input() presentations: HintPresentationResultInterface[] = [];
  @Input() summary: HintExamSummaryInterface | undefined;

  get snrProgressionData(): TrialProgressionPlotDataInterface | undefined {
    return buildSnrProgressionPlotData(this.presentations, this.summary?.srt, 'SNR Progression');
  }

  /**
   * Per-word correct/incorrect flags for a presentation, in sentence order.
   * @param presentation The graded presentation.
   */
  wordResults(presentation: HintPresentationResultInterface): string[] {
    return presentation.sentence.map((_word, index) => (presentation.response.includes(index) ? 'Y' : 'N'));
  }
}
