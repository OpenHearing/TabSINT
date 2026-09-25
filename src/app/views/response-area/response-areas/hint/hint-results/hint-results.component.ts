import { Component, Input } from '@angular/core';

import { HintExamSummaryInterface, HintPresentationResultInterface } from '../hint.interface';

@Component({
  selector: 'app-hint-results',
  templateUrl: './hint-results.component.html',
  styleUrl: './hint-results.component.css',
})
export class HintResultsComponent {
  @Input() presentations: HintPresentationResultInterface[] = [];
  @Input() summary: HintExamSummaryInterface | undefined;

  /**
   * Per-word correct/incorrect flags for a presentation, in sentence order.
   * @param presentation The graded presentation.
   */
  wordResults(presentation: HintPresentationResultInterface): string[] {
    return presentation.sentence.map((_word, index) => (presentation.response.includes(index) ? 'Y' : 'N'));
  }
}
