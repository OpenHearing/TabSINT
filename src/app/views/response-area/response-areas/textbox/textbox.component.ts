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
  }

  onResponseChange() {    
    this.state.doesResponseExist = this.results.currentPage.response !== '';
    this.stateModel.setPageSubmittable();
  }

}
