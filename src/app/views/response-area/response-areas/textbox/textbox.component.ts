import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';

import { ResultsInterface } from '../../../../models/results/results.interface';
import { PageInterface } from '../../../../models/page/page.interface';
import { TextBoxInterface } from './textbox.interface';

import { ResultsModel } from '../../../../models/results/results-model.service';
import { PageModel } from '../../../../models/page/page.service';

import { textBoxSchema } from '../../../../../schema/response-areas/textbox.schema';
import { StateInterface } from '../../../../models/state/state.interface';
import { StateModel } from '../../../../models/state/state.service';
import { ExamService } from '../../../../controllers/exam.service';
import { parsePageParameters } from '../../../../utilities/page-parameter-helper';

@Component({
  selector: 'app-textbox-view',
  templateUrl: './textbox.component.html',
  styleUrl: './textbox.component.css',
})
export class TextboxComponent implements OnInit, OnDestroy {
  private readonly examService = inject(ExamService);
  private readonly resultsModel = inject(ResultsModel);
  private readonly pageModel = inject(PageModel);
  private readonly stateModel = inject(StateModel);

  results: ResultsInterface;
  state: StateInterface;
  rows: number;
  pageParameters?: PageInterface;

  pageSubscription: Subscription | undefined;
  stateSubscription: Subscription | undefined;
  resultsSubscription: Subscription | undefined;

  constructor() {
    this.results = this.resultsModel.getResults();
    this.state = this.stateModel.getState();
    this.rows = textBoxSchema.properties.rows.default;
  }

  ngOnInit(): void {
    this.stateSubscription = this.stateModel.stateSubject.subscribe(updatedState => {
      this.state = updatedState;
    });
    this.resultsSubscription = this.resultsModel.resultsSubject.subscribe(updatedResults => {
      this.results = updatedResults;
    });
    this.pageSubscription = this.pageModel.currentPageObservable.subscribe((updatedPage: PageInterface) => {
      if (updatedPage?.responseArea?.type == 'textboxResponseArea') {
        const updatedTextboxResponseArea = updatedPage.responseArea as TextBoxInterface;
        if (updatedTextboxResponseArea) {
          this.rows = updatedTextboxResponseArea?.rows;
        }
        this.pageParameters = parsePageParameters(updatedPage);
        if (this.pageParameters?.autoSubmit) {
          setTimeout(() => {
            this.examService.submit();
          }, this.pageParameters?.autoSubmitDelay ?? 0);
        }
      }
    });
  }

  ngOnDestroy(): void {
    this.pageSubscription?.unsubscribe();
    this.stateSubscription?.unsubscribe();
    this.resultsSubscription?.unsubscribe();
  }

  onResponseChange() {
    this.stateModel.updateState({ doesResponseExist: this.results.currentPage.response !== '' });
    this.resultsModel.updateCurrentPage({ response: this.results.currentPage.response });
    this.stateModel.setPageSubmittable();
  }

  onEnter() {
    this.examService.submit();
  }
}
