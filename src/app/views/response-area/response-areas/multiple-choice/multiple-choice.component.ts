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

  choices: ChoiceInterface[] | undefined;
  choice: ChoiceInterface | undefined;
  enableOther = false;
  buttonDisabled = true;
  gradeResponse = false;
  showCorrect = true;
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
    });
    this.pageSubscription = this.pageModel.currentPageObservable.subscribe((updatedPage: PageInterface) => {
      if (updatedPage?.responseArea?.type == 'multipleChoiceResponseArea') {
        const updatedMultipleChoiceResponseArea = updatedPage.responseArea as MultipleChoiceInterface;
        if (updatedMultipleChoiceResponseArea) {
          this.choices = _.cloneDeep(updatedMultipleChoiceResponseArea.choices || this.yesNo);
          this.choices = this.choices ?? [];
          if (updatedMultipleChoiceResponseArea.other) {
            this.enableOther = true;
            this.choices.push({
              id: 'Other',
              text: updatedMultipleChoiceResponseArea.other,
            });
          }
          if (updatedMultipleChoiceResponseArea.feedback) {
            this.logger.warning('feedback not yet supported for multiple-choice response area.');
          }
        }
      }
    });
  }

  ngOnDestroy(): void {
    this.pageSubscription?.unsubscribe();
    this.resultsSubscription?.unsubscribe();
    this.stateSubscription?.unsubscribe();
  }

  choose(id: string) {
    this.resultsModel.updateCurrentPage({ response: id });
    this.stateModel.updateState({ doesResponseExist: true });
    this.stateModel.setPageSubmittable();
    if (this.state.isSubmittable && this.results.currentPage.response !== 'Other') {
      this.examService.submit = this.examService.submitDefault;
      this.examService.submit();
    }
  }
}
