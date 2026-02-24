import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';

import { ResultsInterface } from '../../../../models/results/results.interface';
import { PageInterface } from '../../../../interfaces/page-definition.interface';

import { ResultsModel } from '../../../../models/results/results-model.service';
import { TextBoxResultViewerInterface } from './textbox-result-viewer.interface';
import { ResultViewResponsesInterface } from '../../../../interfaces/result-view-responses.interface';
import { ExamService } from '../../../../controllers/exam.service';

@Component({
  selector: 'textbox-result-viewer-view',
  templateUrl: './textbox-result-viewer.component.html',
})
export class TextboxResultViewerComponent implements OnInit, OnDestroy {
  results: ResultsInterface;
  responses?: ResultViewResponsesInterface[];
  pageSubscription: Subscription | undefined;

  constructor(
    private readonly resultsModel: ResultsModel,
    private readonly examService: ExamService
  ) {
    this.results = this.resultsModel.getResults();
  }

  ngOnInit(): void {
    this.pageSubscription = this.examService.currentPageObservable.subscribe((updatedPage: PageInterface) => {
      if (updatedPage.responseArea?.type === 'textboxResponseAreaResultViewer') {
        const textboxResponseAreaResultViewer = updatedPage.responseArea as TextBoxResultViewerInterface;
        this.responses = this.results.currentExam.responses
          .filter((response: { pageId: string }) => textboxResponseAreaResultViewer.pageIdsToDisplay.includes(response.pageId))
          .map((response: any) => ({
            title: response.page.title,
            questionMainText: response.page.questionMainText,
            questionSubText: response.page.questionSubText,
            instructionText: response.page.instructionText,
            response: response.response,
          }));
      }
    });
  }

  ngOnDestroy(): void {
    this.pageSubscription?.unsubscribe();
  }
}
