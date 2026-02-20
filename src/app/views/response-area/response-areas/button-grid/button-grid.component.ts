import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { ResultsInterface } from '../../../../models/results/results.interface';
import { PageInterface } from '../../../../models/page/page.interface';
import { ButtonGridInterface } from './button-grid.interface';
import { ResultsModel } from '../../../../models/results/results-model.service';
import { PageModel } from '../../../../models/page/page.service';
import { buttonGridSchema } from '../../../../../schema/response-areas/button-grid.schema';
import { StateInterface } from '../../../../models/state/state.interface';
import { StateModel } from '../../../../models/state/state.service';
import { ExamService } from '../../../../controllers/exam.service';
import { ChoiceInterface } from '../../../../interfaces/choice.interface';
import { Logger } from '../../../../services/logger.service';
import { RowInterface } from '../../../../interfaces/row.interface';
import { choiceSchema } from '../../../../../schema/definitions/choice.schema';
import { choiceBtnClassHelper } from '../../../../utilities/response-area-helper-functions';

@Component({
  selector: 'app-button-grid',
  templateUrl: './button-grid.component.html',
  styleUrl: './button-grid.component.css',
})
export class ButtonGridComponent implements OnInit, OnDestroy {
  private readonly examService = inject(ExamService);
  private readonly resultsModel = inject(ResultsModel);
  private readonly pageModel = inject(PageModel);
  private readonly stateModel = inject(StateModel);
  private readonly logger = inject(Logger);

  results: ResultsInterface;
  state: StateInterface;
  rows: RowInterface[];
  feedback: string;
  verticalSpacing: number;
  horizontalSpacing: number;
  delayEnable: number;
  choices: ChoiceInterface[] = [];
  submitted = false;

  pageSubscription: Subscription | undefined;
  stateSubscription: Subscription | undefined;
  resultsSubscription: Subscription | undefined;

  constructor() {
    this.results = this.resultsModel.getResults();
    this.state = this.stateModel.getState();
    this.rows = buttonGridSchema.properties.rows.default;
    this.feedback = buttonGridSchema.properties.feedback.default;
    this.verticalSpacing = buttonGridSchema.properties.verticalSpacing.default;
    this.horizontalSpacing = buttonGridSchema.properties.horizontalSpacing.default;
    this.delayEnable = buttonGridSchema.properties.delayEnable.default;
  }

  ngOnInit(): void {
    this.stateSubscription = this.stateModel.stateSubject.subscribe((updatedState: StateInterface) => {
      this.state = updatedState;
    });
    this.resultsSubscription = this.resultsModel.resultsSubject.subscribe((updatedResults: ResultsInterface) => {
      this.results = updatedResults;
      if (typeof this.results.currentPage.response !== 'object') {
        this.results.currentPage.response = {
          selected: [],
        };
      }
    });
    this.pageSubscription = this.pageModel.currentPageObservable.subscribe((updatedPage: PageInterface) => {
      if (updatedPage?.responseArea?.type === 'buttonGridResponseArea') {
        const updatedButtonGridResponseArea = updatedPage.responseArea as ButtonGridInterface;
        if (updatedButtonGridResponseArea) {
          this.rows = updatedButtonGridResponseArea.rows;
          // Fill in defaults for choices of each row
          this.choices = [];
          this.rows.forEach(row => {
            row.choices.forEach(choice => {
              choice.text = choice.text ?? choice.id;
              choice.correct = choice.correct ?? choiceSchema.properties.correct.default;
              choice.disable = choice.disable ?? choiceSchema.properties.disable.default;
              choice.textColor = choice.textColor ?? choiceSchema.properties.textColor.default;
              choice.backgroundColor = choice.backgroundColor ?? choiceSchema.properties.backgroundColor.default;
              choice.fontSize = choice.fontSize ?? choiceSchema.properties.fontSize.default;
              this.choices.push(choice);
            });
          });
          this.feedback = updatedButtonGridResponseArea.feedback ?? this.feedback;
          this.verticalSpacing = updatedButtonGridResponseArea.verticalSpacing ?? this.verticalSpacing;
          this.horizontalSpacing = updatedButtonGridResponseArea.horizontalSpacing ?? this.horizontalSpacing;
          this.horizontalSpacing = updatedButtonGridResponseArea.horizontalSpacing ?? this.horizontalSpacing;
          this.delayEnable = updatedButtonGridResponseArea.delayEnable ?? this.delayEnable;

          // delay 100ms to allow results and exam defaults to be set before we override them
          setTimeout(() => {
            (this.results.currentPage.page.responseArea as ButtonGridInterface).choices = this.choices;
            // Allow for 1250ms delay if feedback is present
            if (this.feedback) {
              this.examService.submit = () => {
                this.submitted = true;
                setTimeout(() => {
                  this.examService.submit = this.examService.submitDefault;
                  this.examService.submit();
                  this.submitted = false;
                }, 1250);
              };
            }
          }, 100);
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
  }

  choiceSelected(id: string) {
    // Remove element if already selected, else add element to selected
    if (this.results.currentPage.response.selected.includes(id)) {
      const index = this.results.currentPage.response.selected.indexOf(id);
      if (index > -1) {
        this.results.currentPage.response.selected.splice(index, 1);
      }
    } else {
      this.results.currentPage.response.selected.push(id);
    }
    this.resultsModel.updateCurrentPage({ response: this.results.currentPage.response });
    // Set page submittable
    if (this.results.currentPage.response.selected.length > 0) {
      this.stateModel.updateState({ doesResponseExist: true });
    } else {
      this.stateModel.updateState({ doesResponseExist: false });
    }
    this.stateModel.setPageSubmittable();
    this.examService.submit();
  }

  onEnter() {
    this.examService.submit();
  }

  buttonGridBtnClass(choice: ChoiceInterface) {
    const options = {
      feedback: this.submitted ? this.feedback : undefined,
    };
    return choiceBtnClassHelper(choice, this.results.currentPage.response, options);
  }
}
