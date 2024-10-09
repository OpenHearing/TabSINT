import { Component, OnDestroy, OnInit } from '@angular/core';
import * as _ from 'lodash';

import { ResultsInterface } from '../../../../models/results/results.interface';
import { ResultsModel } from '../../../../models/results/results-model.service';
import { ProtocolModelInterface } from '../../../../models/protocol/protocol.interface';
import { StateInterface } from '../../../../models/state/state.interface';
import { StateModel } from '../../../../models/state/state.service';
import { ProtocolModel } from '../../../../models/protocol/protocol-model.service';
import { ChoiceInterface, MultipleChoiceInterface } from './multiple-choice.interface';
import { Logger } from '../../../../utilities/logger.service';
import { Subscription } from 'rxjs';
import { PageInterface } from '../../../../models/page/page.interface';
import { PageModel } from '../../../../models/page/page.service';
import { ExamService } from '../../../../controllers/exam.service';

@Component({
  selector: 'multiple-choice-view',
  templateUrl: './multiple-choice.component.html',
  styleUrl: './multiple-choice.component.css'
})
export class MultipleChoiceComponent implements OnInit, OnDestroy {
  results: ResultsInterface;
  state: StateInterface;
  protocol: ProtocolModelInterface;
  pageSubscription: Subscription|undefined;

  constructor (
    private readonly logger: Logger,
    private readonly resultsModel: ResultsModel, 
    private readonly stateModel: StateModel,
    private readonly pageModel: PageModel,
    private readonly protocolModel: ProtocolModel,
    private readonly examService: ExamService
  ) {
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
      id: "yes",
      text: "Yes"
    },
    {
      id: "no",
      text: "No"
    }
  ];

  ngOnInit() {
    this.pageSubscription = this.pageModel.currentPageSubject.subscribe( (updatedPage:PageInterface) => {
      if (updatedPage?.responseArea?.type == "multipleChoiceResponseArea") {
        const updatedMultipleChoiceResponseArea = updatedPage.responseArea as MultipleChoiceInterface;
        if (updatedMultipleChoiceResponseArea) {
          this.choices = _.cloneDeep(updatedMultipleChoiceResponseArea.choices || this.yesNo);
          if (updatedMultipleChoiceResponseArea.other) {
            this.enableOther = true;
            this.choices.push({
              id: "Other",
              text: updatedMultipleChoiceResponseArea.other
            });
          }
          this.logger.debug("choices for multiple-choice responseArea" + JSON.stringify(this.choices));
        }
      }
    });
  }

  ngOnDestroy() {
    this.pageSubscription?.unsubscribe();
  }

  choose(id: string) {
    this.results.currentPage.response = id;
    this.state.isSubmittable = true;
    if (this.state.isSubmittable && this.results.currentPage.response !== "Other") {
      this.examService.submit = this.examService.submitDefault;
      this.examService.submit();
    }
  };

}
