import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';

import { ResultsInterface } from '../../../../models/results/results.interface';
import { PageInterface } from '../../../../models/page/page.interface';
import { SubjectIdInterface } from './subject-id.interface';

import { ResultsModel } from '../../../../models/results/results-model.service';
import { PageModel } from '../../../../models/page/page.service';

import { subjectIdSchema } from '../../../../../schema/response-areas/subject-id.schema';
import { StateInterface } from '../../../../models/state/state.interface';
import { StateModel } from '../../../../models/state/state.service';
import { ExamService } from '../../../../controllers/exam.service';

@Component({
  selector: 'app-subject-id',
  templateUrl: './subject-id.component.html',
})
export class SubjectIdComponent implements OnInit, OnDestroy {
  private readonly examService = inject(ExamService);
  private readonly resultsModel = inject(ResultsModel);
  private readonly pageModel = inject(PageModel);
  private readonly stateModel = inject(StateModel);

  results: ResultsInterface;
  state: StateInterface;
  generate: boolean;

  pageSubscription: Subscription | undefined;
  stateSubscription: Subscription | undefined;
  resultsSubscription: Subscription | undefined;

  constructor() {
    this.results = this.resultsModel.getResults();
    this.state = this.stateModel.getState();
    this.generate = subjectIdSchema.properties.generate.default;
  }

  ngOnInit(): void {
    this.stateSubscription = this.stateModel.stateSubject.subscribe(updatedState => {
      this.state = updatedState;
    });
    this.resultsSubscription = this.resultsModel.resultsSubject.subscribe(updatedResults => {
      this.results = updatedResults;
    });
    this.pageSubscription = this.pageModel.currentPageObservable.subscribe((updatedPage: PageInterface) => {
      if (updatedPage?.responseArea?.type == 'subjectIdResponseArea') {
        const updatedSubjectIdResponseArea = updatedPage.responseArea as SubjectIdInterface;
        if (updatedSubjectIdResponseArea) {
          this.generate = updatedSubjectIdResponseArea.generate ?? this.generate;
        }
        if (this.generate) {
          // Generate a random 5-digit ascii/letter-number
          const len = 5;
          let randomId = '';
          const possible = 'abcdefghijklmnopqrstuvwxyz0123456789';
          for (let i = 0; i < len; i++) {
            randomId += possible.charAt(Math.floor(Math.random() * possible.length));
          }
          this.results.currentPage.response = randomId;
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
