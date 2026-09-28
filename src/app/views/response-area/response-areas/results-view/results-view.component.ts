import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { Subscription } from 'rxjs';

import { CurrentResults, ResultsInterface } from '../../../../models/results/results.interface';
import { PageInterface } from '../../../../models/page/page.interface';

import { ResultsModel } from '../../../../models/results/results-model.service';
import { PageModel } from '../../../../models/page/page.service';
import { ResultsViewResponseAreaInterface } from './results-view.interface';

@Component({
  selector: 'app-results-view',
  templateUrl: './results-view.component.html',
})
export class ResultsViewComponent implements OnInit, OnDestroy {
  private readonly resultsModel = inject(ResultsModel);
  private readonly pageModel = inject(PageModel);

  currentPage: PageInterface;
  results: ResultsInterface;
  matchedResults?: CurrentResults[];
  pageSubscription: Subscription | undefined;

  constructor() {
    this.results = this.resultsModel.getResults();
    this.currentPage = this.pageModel.getPage();
  }

  ngOnInit(): void {
    this.pageSubscription = this.pageModel.currentPageObservable.subscribe((updatedPage: PageInterface) => {
      if (updatedPage.responseArea?.type === 'resultsViewResponseArea') {
        const resultsView = updatedPage.responseArea as ResultsViewResponseAreaInterface;
        this.matchedResults = this.results.currentExam.responses.filter((response: CurrentResults) =>
          resultsView.pageIdsToDisplay.includes(response.pageId)
        );
      }
    });
  }

  ngOnDestroy(): void {
    this.pageSubscription?.unsubscribe();
  }
}
