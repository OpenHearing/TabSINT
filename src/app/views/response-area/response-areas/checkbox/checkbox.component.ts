import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';

import { ResultsInterface } from '../../../../models/results/results.interface';
import { PageInterface } from '../../../../models/page/page.interface';
import { CheckboxChoiceInterface, CheckboxInterface } from './checkbox.interface';

import { ResultsModel } from '../../../../models/results/results-model.service';
import { PageModel } from '../../../../models/page/page.service';

import { checkboxSchema } from '../../../../../schema/response-areas/checkbox.schema';
import { StateInterface } from '../../../../models/state/state.interface';
import { StateModel } from '../../../../models/state/state.service';
import { ExamService } from '../../../../controllers/exam.service';

@Component({
  selector: 'app-checkbox',
  templateUrl: './checkbox.component.html',
  styleUrl: './checkbox.component.css',
})
export class CheckboxComponent implements OnInit, OnDestroy {
  private readonly examService = inject(ExamService);
  private readonly resultsModel = inject(ResultsModel);
  private readonly pageModel = inject(PageModel);
  private readonly stateModel = inject(StateModel);

  results: ResultsInterface;
  state: StateInterface;
  choices: CheckboxChoiceInterface[];
  buttonScheme: string;
  other: string;
  verticalSpacing: number;
  otherSelected: boolean = false;

  pageSubscription: Subscription | undefined;
  stateSubscription: Subscription | undefined;
  resultsSubscription: Subscription | undefined;

  constructor() {
    this.results = this.resultsModel.getResults();
    this.state = this.stateModel.getState();
    this.choices = checkboxSchema.properties.choices.default;
    this.buttonScheme = checkboxSchema.properties.buttonScheme.default;
    this.other = checkboxSchema.properties.other.default;
    this.verticalSpacing = checkboxSchema.properties.verticalSpacing.default;
  }

  ngOnInit(): void {
    this.stateSubscription = this.stateModel.stateSubject.subscribe(updatedState => {
      this.state = updatedState;
    });
    this.resultsSubscription = this.resultsModel.resultsSubject.subscribe(updatedResults => {
      this.results = updatedResults;
    });
    this.pageSubscription = this.pageModel.currentPageObservable.subscribe((updatedPage: PageInterface) => {
      if (updatedPage?.responseArea?.type == 'checkboxResponseArea') {
        const updatedCheckboxResponseArea = updatedPage.responseArea as CheckboxInterface;
        if (updatedCheckboxResponseArea) {
          this.choices = updatedCheckboxResponseArea.choices;
          this.choices.forEach(choice => {
            choice.text = choice.text ?? choice.id;
          });
          this.buttonScheme = updatedCheckboxResponseArea.buttonScheme ?? this.buttonScheme;
          this.other = updatedCheckboxResponseArea.other ?? this.other;
          this.verticalSpacing = updatedCheckboxResponseArea.verticalSpacing ?? this.verticalSpacing;
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

  choiceSelected(id: string) {
    this.results.currentPage.response = id;
    this.resultsModel.updateCurrentPage({ response: this.results.currentPage.response });
    this.examService.submit();
  }

  toggleOther() {
    this.otherSelected = !this.otherSelected;
  }

  onEnter() {
    this.examService.submit();
  }
}
