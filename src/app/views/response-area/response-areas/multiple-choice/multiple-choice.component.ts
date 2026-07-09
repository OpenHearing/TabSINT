import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import * as _ from 'lodash';

import { ResultsInterface } from '../../../../models/results/results.interface';
import { ResultsModel } from '../../../../models/results/results-model.service';
import { ProtocolModelInterface } from '../../../../models/protocol/protocol.interface';
import { StateInterface } from '../../../../models/state/state.interface';
import { StateModel } from '../../../../models/state/state.service';
import { ProtocolModel } from '../../../../models/protocol/protocol-model.service';
import { MultipleChoiceInterface } from './multiple-choice.interface';
import { ChoiceInterface } from '../../../../interfaces/choice.interface';
import { Subscription } from 'rxjs';
import { PageInterface } from '../../../../models/page/page.interface';
import { PageModel } from '../../../../models/page/page.service';
import { ExamService } from '../../../../controllers/exam.service';
import { Logger } from '../../../../services/logger.service';
import { multipleChoiceSchema } from '../../../../../schema/response-areas/multiple-choice.schema';
import { choiceBtnClassHelper } from '../../../../utilities/response-area-helper-functions';
import { choiceSchema } from '../../../../../schema/definitions/choice.schema';

@Component({
  selector: 'app-multiple-choice-view',
  templateUrl: './multiple-choice.component.html',
  styleUrl: './multiple-choice.component.css',
})
export class MultipleChoiceComponent implements OnInit, OnDestroy {
  private readonly examService = inject(ExamService);
  private readonly resultsModel = inject(ResultsModel);
  private readonly pageModel = inject(PageModel);
  private readonly stateModel = inject(StateModel);
  private readonly protocolModel = inject(ProtocolModel);
  private readonly logger = inject(Logger);

  results: ResultsInterface;
  state: StateInterface;
  protocol: ProtocolModelInterface;

  pageSubscription: Subscription | undefined;
  stateSubscription: Subscription | undefined;
  resultsSubscription: Subscription | undefined;

  constructor() {
    this.results = this.resultsModel.getResults();
    this.protocol = this.protocolModel.getProtocolModel();
    this.state = this.stateModel.getState();
  }

  verticalSpacing: number = multipleChoiceSchema.properties.verticalSpacing.default;
  feedback: string = multipleChoiceSchema.properties.feedback.default;
  delayEnable: number = multipleChoiceSchema.properties.delayEnable.default;
  other: string = multipleChoiceSchema.properties.other.default;

  choices: ChoiceInterface[] = [];
  otherSelected: boolean = false;
  submitted: boolean = false;
  disableButtons: boolean = true;
  enableOther: boolean = false;
  paddingBottom: string = '1px';
  yesNo = [
    {
      id: 'yes',
      text: 'Yes',
    },
    {
      id: 'no',
      text: 'No',
    },
  ];

  ngOnInit(): void {
    this.stateSubscription = this.stateModel.stateSubject.subscribe((updatedState: StateInterface) => {
      this.state = updatedState;
    });
    this.resultsSubscription = this.resultsModel.resultsSubject.subscribe((updatedResults: ResultsInterface) => {
      this.results = updatedResults;
      if (typeof this.results.currentPage.response !== 'object') {
        this.results.currentPage.response = {
          selected: null,
        };
      }
    });
    this.pageSubscription = this.pageModel.currentPageObservable.subscribe((updatedPage: PageInterface) => {
      if (updatedPage?.responseArea?.type == 'multipleChoiceResponseArea') {
        const updatedMultipleChoiceResponseArea = updatedPage.responseArea as MultipleChoiceInterface;
        if (updatedMultipleChoiceResponseArea) {
          this.enableOther = false;
          this.otherSelected = false;
          const rawchoices: ChoiceInterface[] = _.cloneDeep(updatedMultipleChoiceResponseArea.choices || this.yesNo);
          this.choices = [];
          rawchoices.forEach(choice => {
            choice.text = choice.text ?? String(choice.id);
            choice.correct = choice.correct ?? choiceSchema.properties.correct.default;
            choice.disable = choice.disable ?? choiceSchema.properties.disable.default;
            choice.textColor = choice.textColor ?? choiceSchema.properties.textColor.default;
            choice.backgroundColor = choice.backgroundColor ?? choiceSchema.properties.backgroundColor.default;
            choice.fontSize = choice.fontSize ?? choiceSchema.properties.fontSize.default;
            this.choices.push(choice);
          });

          this.feedback = updatedMultipleChoiceResponseArea.feedback ?? multipleChoiceSchema.properties.feedback.default;
          this.verticalSpacing = updatedMultipleChoiceResponseArea.verticalSpacing ?? multipleChoiceSchema.properties.verticalSpacing.default;
          this.delayEnable = updatedMultipleChoiceResponseArea.delayEnable ?? multipleChoiceSchema.properties.delayEnable.default;
          this.other = updatedMultipleChoiceResponseArea.other ?? multipleChoiceSchema.properties.other.default;

          this.paddingBottom = this.verticalSpacing.toString() + 'px';

          if (updatedMultipleChoiceResponseArea.other) {
            this.enableOther = true;
            this.choices.push({
              id: 'Other',
              text: updatedMultipleChoiceResponseArea.other,
            });
            this.results.currentPage.response.other = '';
          }

          this.disableButtons = true;
          setTimeout(() => {
            this.disableButtons = false;
          }, this.delayEnable);

          // delay 100ms to allow results and exam defaults to be set before we override them
          setTimeout(() => {
            (this.results.currentPage.page.responseArea as MultipleChoiceInterface).choices = this.choices;
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
    this.resultsSubscription?.unsubscribe();
    this.stateSubscription?.unsubscribe();
  }

  choose(id: string | number) {
    const isOther = id === 'Other';
    if (isOther !== this.otherSelected) {
      this.toggleOther();
    }
    this.results.currentPage.response.selected = id;
    this.resultsModel.updateCurrentPage({ response: this.results.currentPage.response });
    this.stateModel.updateState({ doesResponseExist: true });
    this.stateModel.setPageSubmittable();
    if (this.state.isSubmittable && !isOther) {
      this.examService.submit();
    }
  }

  toggleOther() {
    this.otherSelected = !this.otherSelected;
    // Clear the other field if it was toggled off
    if (!this.otherSelected) {
      this.results.currentPage.response.other = '';
    }
  }

  onResponseChange() {
    this.stateModel.updateState({ doesResponseExist: this.results.currentPage.response.other !== '' });
    this.resultsModel.updateCurrentPage({ response: this.results.currentPage.response });
  }

  onEnter() {
    this.examService.submit();
  }

  multipleChoiceBtnClass(choice: ChoiceInterface) {
    const options = {
      feedback: this.submitted ? this.feedback : undefined,
      disableButton: this.disableButtons,
    };
    return choiceBtnClassHelper(choice, this.results.currentPage.response, options);
  }
}
