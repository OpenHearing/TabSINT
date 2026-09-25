import { Component, Input } from '@angular/core';

import { ThreeDigitPresentationResultInterface } from '../three-digit.interface';

@Component({
  selector: 'app-three-digit-results',
  templateUrl: './three-digit-results.component.html',
  styleUrl: './three-digit-results.component.css',
})
export class ThreeDigitResultsComponent {
  @Input() presentations: ThreeDigitPresentationResultInterface[] = [];

  /**
   * Per-digit correct/incorrect flags for a presentation, in digit order.
   * @param presentation The graded presentation.
   */
  digitResults(presentation: ThreeDigitPresentationResultInterface): string[] {
    return presentation.eachCorrect.map(correct => (correct ? 'Y' : 'N'));
  }
}
