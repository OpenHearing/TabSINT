import { Component, Input } from '@angular/core';

import { SswPresentationResultInterface } from '../ssw.interface';

@Component({
  selector: 'app-ssw-results',
  templateUrl: './ssw-results.component.html',
  styleUrl: './ssw-results.component.css',
})
export class SswResultsComponent {
  @Input() presentations: SswPresentationResultInterface[] = [];

  /**
   * Number of presentations in which every word was repeated correctly and in order.
   */
  get correctPresentationCount(): number {
    return this.presentations.filter(presentation => presentation.correct).length;
  }

  /**
   * Per-word correct/incorrect flags for a presentation, in presentation order.
   * @param presentation The graded presentation.
   */
  wordResults(presentation: SswPresentationResultInterface): string[] {
    return presentation.response.map(order => (order !== 0 ? 'Y' : 'N'));
  }
}
