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
      if (updatedPage?.responseArea?.type == 'buttonGridResponseArea') {
        const updatedButtonGridResponseArea = updatedPage.responseArea as ButtonGridInterface;
        if (updatedButtonGridResponseArea) {
          this.rows = updatedButtonGridResponseArea.rows;
          // Fill in defaults for choices of each row
          this.rows.forEach(row => {
            row.choices.forEach(choice => {
              choice.text = choice.text ?? choice.id;
              choice.correct = choiceSchema.properties.correct.default;
              choice.disable = choiceSchema.properties.disable.default;
              choice.textColor = choiceSchema.properties.textColor.default;
              choice.backgroundColor = choiceSchema.properties.backgroundColor.default;
              choice.fontSize = choiceSchema.properties.fontSize.default;
            });
          });
          this.feedback = updatedButtonGridResponseArea.feedback ?? this.feedback;
          this.verticalSpacing = updatedButtonGridResponseArea.verticalSpacing ?? this.verticalSpacing;
          this.horizontalSpacing = updatedButtonGridResponseArea.horizontalSpacing ?? this.horizontalSpacing;
          this.horizontalSpacing = updatedButtonGridResponseArea.horizontalSpacing ?? this.horizontalSpacing;
          this.delayEnable = updatedButtonGridResponseArea.delayEnable ?? this.delayEnable;

          // TODO: Implement this functionality and remove this logging
          if (this.feedback) {
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
