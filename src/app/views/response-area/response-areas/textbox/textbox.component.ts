import { Component, OnDestroy, OnInit } from '@angular/core';
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
import { response } from 'express';

@Component({
  selector: 'textbox-view',
  templateUrl: './textbox.component.html',
  styleUrl: './textbox.component.css'
})
export class TextboxComponent implements OnInit, OnDestroy {
  results: ResultsInterface;
  state: StateInterface;
  rows: number;

  pageSubscription: Subscription | undefined;
  stateSubscription: Subscription | undefined;
  resultsSubscription: Subscription | undefined;

  constructor (
    private readonly examService: ExamService, 
    private readonly resultsModel: ResultsModel,
    private readonly pageModel: PageModel,
    private readonly stateModel: StateModel
  ) {
    this.results = this.resultsModel.getResults();
    this.state = this.stateModel.getState();
    this.rows = textBoxSchema.properties.rows.default;
  }

  ngOnInit() {
    this.stateSubscription = this.stateModel.stateSubject.subscribe( (updatedState) => {
      this.state = updatedState;
    });
    this.resultsSubscription = this.resultsModel.resultsSubject.subscribe( (updatedResults) => {
      this.results = updatedResults;
    });
    this.pageSubscription = this.pageModel.currentPageSubject.subscribe( (updatedPage: PageInterface) => {
      if (updatedPage?.responseArea?.type == "textboxResponseArea") {
        const updatedTextboxResponseArea = updatedPage.responseArea as TextBoxInterface;
        if (updatedTextboxResponseArea) {
          this.rows = updatedTextboxResponseArea?.rows;
        }
      }
    });
  }

  ngOnDestroy() {
    this.pageSubscription?.unsubscribe();
    this.stateSubscription?.unsubscribe();
    this.resultsSubscription?.unsubscribe();
  }

  onResponseChange() {    
    this.stateModel.updateState({doesResponseExist: this.results.currentPage.response !== ''});
    this.resultsModel.updateCurrentPage({response: this.results.currentPage.response});
    this.stateModel.setPageSubmittable();
  }

}
