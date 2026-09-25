import { Component, Input, OnDestroy, OnInit, inject } from '@angular/core';
import { Subscription } from 'rxjs';

import { AudiometryResultsInterface } from '../../../../../interfaces/audiometry-results.interface';
import { CurrentResults } from '../../../../../models/results/results.interface';
import { PageInterface } from '../../../../../models/page/page.interface';
import { ExamService } from '../../../../../controllers/exam.service';
import { PageModel } from '../../../../../models/page/page.service';
import { ResultsModel } from '../../../../../models/results/results-model.service';
import { ResultType } from '../../../../../utilities/constants';
import { ManualAudiometryResultViewerInterface } from './manual-audiometry-result-viewer.interface';

const EMPTY_AUDIOGRAM_DATA: AudiometryResultsInterface = {
  frequencies: [],
  thresholds: [],
  channels: [],
  resultTypes: [],
  masking: [],
  levelUnits: '',
};

/**
 * Renders a combined audiogram from an `AudiometryResultsInterface`. Used two ways:
 * - Live, at the end of a manual-audiometry exam: the parent binds `audiogramData` directly from
 *   its in-progress results, and this component's own Submit button advances the page.
 * - Standalone, as a `manualAudiometryResultViewerResponseArea` page reviewing past results: with
 *   no `audiogramData` input bound, this pulls the stored responses for `pageIdsToDisplay` from
 *   resultsModel instead. The `@Input` always wins when set, so the live binding is unaffected.
 */
@Component({
  selector: 'app-manual-audiometry-result-viewer',
  templateUrl: './manual-audiometry-result-viewer.html',
  styleUrl: './manual-audiometry-result-viewer.css',
})
export class ManualAudiometryResultViewerComponent implements OnInit, OnDestroy {
  private readonly examService = inject(ExamService);
  private readonly pageModel = inject(PageModel);
  private readonly resultsModel = inject(ResultsModel);

  @Input() audiogramData?: AudiometryResultsInterface;

  private pageSubscription: Subscription | undefined;

  ngOnInit(): void {
    this.pageSubscription = this.pageModel.currentPageObservable.subscribe((updatedPage: PageInterface) => {
      if (this.audiogramData || updatedPage.responseArea?.type !== 'manualAudiometryResultViewerResponseArea') {
        return;
      }
      const { pageIdsToDisplay } = updatedPage.responseArea as ManualAudiometryResultViewerInterface;
      this.audiogramData = this.buildAudiogramData(pageIdsToDisplay);
    });
  }

  ngOnDestroy(): void {
    this.pageSubscription?.unsubscribe();
  }

  submitResults() {
    this.examService.submitDefault();
  }

  get ResultType() {
    return ResultType;
  }

  /**
   * Concatenate the stored audiogram results for the given page ids into one combined struct.
   * @param pageIdsToDisplay The pages, each expected to hold an AudiometryResultsInterface response.
   */
  private buildAudiogramData(pageIdsToDisplay: string[]): AudiometryResultsInterface {
    const responses = this.resultsModel.getResults().currentExam.responses as CurrentResults[];
    const matches = responses.filter(response => pageIdsToDisplay.includes(response.pageId));
    return matches.reduce<AudiometryResultsInterface>((combined, match) => {
      const data = match.response as AudiometryResultsInterface | undefined;
      if (!data) {
        return combined;
      }
      return {
        frequencies: [...combined.frequencies, ...data.frequencies],
        thresholds: [...combined.thresholds, ...data.thresholds],
        channels: [...combined.channels, ...data.channels],
        resultTypes: [...combined.resultTypes, ...data.resultTypes],
        masking: [...combined.masking, ...data.masking],
        levelUnits: data.levelUnits ?? combined.levelUnits,
      };
    }, EMPTY_AUDIOGRAM_DATA);
  }
}
