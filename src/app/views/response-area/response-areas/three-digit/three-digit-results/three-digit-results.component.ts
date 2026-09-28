import { Component, Input } from '@angular/core';

import { buildSnrProgressionPlotData } from '../../../../../utilities/build-snr-progression-plot.function';
import { TrialProgressionPlotDataInterface } from '../../shared/trial-progression-plot/trial-progression-plot.interface';
import { ThreeDigitPresentationResultInterface } from '../three-digit.interface';

@Component({
  selector: 'app-three-digit-results',
  templateUrl: './three-digit-results.component.html',
  styleUrl: './three-digit-results.component.css',
})
export class ThreeDigitResultsComponent {
  @Input() presentations: ThreeDigitPresentationResultInterface[] = [];

  get snrProgressionData(): TrialProgressionPlotDataInterface | undefined {
    return buildSnrProgressionPlotData(
      this.presentations.map(presentation => ({ snr: presentation.currentSNR, correct: presentation.correct })),
      undefined,
      'SNR Progression'
    );
  }

  /**
   * Per-digit correct/incorrect flags for a presentation, in digit order.
   * @param presentation The graded presentation.
   */
  digitResults(presentation: ThreeDigitPresentationResultInterface): string[] {
    return presentation.eachCorrect.map(correct => (correct ? 'Y' : 'N'));
  }
}
