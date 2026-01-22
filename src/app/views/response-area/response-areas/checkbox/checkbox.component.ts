import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { ResultsInterface } from '../../../../models/results/results.interface';
import { PageInterface } from '../../../../models/page/page.interface';
import { CheckboxInterface } from './checkbox.interface';
import { ResultsModel } from '../../../../models/results/results-model.service';
import { PageModel } from '../../../../models/page/page.service';
import { checkboxSchema } from '../../../../../schema/response-areas/checkbox.schema';
import { StateInterface } from '../../../../models/state/state.interface';
import { StateModel } from '../../../../models/state/state.service';
import { ExamService } from '../../../../controllers/exam.service';
import { ChoiceInterface } from '../../../../interfaces/choice.interface';
import { Logger } from '../../../../services/logger.service';

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
  private readonly logger = inject(Logger);

  results: ResultsInterface;
  state: StateInterface;
  choices: ChoiceInterface[];
  buttonScheme: string;
  feedback: string;
  other: string | undefined;
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
    this.feedback = checkboxSchema.properties.feedback.default;
    this.verticalSpacing = checkboxSchema.properties.verticalSpacing.default;
  }

  ngOnInit(): void {
    this.stateSubscription = this.stateModel.stateSubject.subscribe(updatedState => {
      this.state = updatedState;
    });
    this.resultsSubscription = this.resultsModel.resultsSubject.subscribe(updatedResults => {
      this.results = updatedResults;
      if (typeof this.results.currentPage.response !== 'object') {
        this.results.currentPage.response = {
          selected: [],
        };
      }
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
          this.feedback = updatedCheckboxResponseArea.feedback ?? this.feedback;
          this.verticalSpacing = updatedCheckboxResponseArea.verticalSpacing ?? this.verticalSpacing;
          this.other = updatedCheckboxResponseArea.other ?? this.other;
          if (this.other) {
            this.choices.push({
              id: 'Other',
              text: this.other ?? 'Other',
            });
            this.results.currentPage.response.other = '';
          }
          // TODO: Implement this functionality and remove this logging
          if (this.buttonScheme || this.feedback) {
            this.logger.warning('buttonScheme and feedback not yet supported for checkbox response area.');
          }
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
    this.stateModel.updateState({ doesResponseExist: this.results.currentPage.response.other !== '' });
    this.resultsModel.updateCurrentPage({ response: this.results.currentPage.response.other });
    this.stateModel.setPageSubmittable();
  }

  choiceSelected(id: string) {
    // Handle the other case
    if (id === 'Other') {
      this.toggleOther();
    }
    // Remove element if already selected, else add element to slected
    if (this.results.currentPage.response.selected.includes(id)) {
      const index = this.results.currentPage.response.selected.indexOf(id);
      if (index > -1) {
        this.results.currentPage.response.selected.splice(index, 1);
      }
    } else {
      this.results.currentPage.response.selected.push(id);
    }
    this.resultsModel.updateCurrentPage({ response: this.results.currentPage.response });
  }

  toggleOther() {
    this.otherSelected = !this.otherSelected;
    // Clear the other field if it was toggled off
    if (!this.otherSelected) {
      this.results.currentPage.response.other = '';
    }
  }

  onEnter() {
    this.examService.submit();
  }

  checkboxBtnClass(choice: ChoiceInterface) {
    let btnClass = 'btn btn-block ';
    if (this.results.currentPage.response.selected.includes(choice.id)) {
      btnClass += 'btn-default active ';
    } else {
      btnClass += 'btn-default ';
    }
    return btnClass;
  }
}
