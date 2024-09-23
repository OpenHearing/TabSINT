import { Component } from '@angular/core';
import * as _ from 'lodash';

import { ExamService } from '../../../../controllers/exam.service';
import { ResultsInterface } from '../../../../models/results/results.interface';
import { ResultsModel } from '../../../../models/results/results-model.service';
import { ProtocolModelInterface } from '../../../../models/protocol/protocol.interface';
import { StateInterface } from '../../../../models/state/state.interface';
import { StateModel } from '../../../../models/state/state.service';
import { ProtocolModel } from '../../../../models/protocol/protocol-model.service';
import { ChoiceInterface, MultipleChoiceInterface } from './multiple-choice.interface';
import { Logger } from '../../../../utilities/logger.service';

@Component({
  selector: 'multiple-choice-view',
  templateUrl: './multiple-choice.component.html',
  styleUrl: './multiple-choice.component.css'
})
export class MultipleChoiceComponent {
  results: ResultsInterface;
  state: StateInterface;
  protocol: ProtocolModelInterface;

  constructor (
    public logger: Logger,
    public resultsModel: ResultsModel, 
    public examService: ExamService,
    public stateModel: StateModel,
    public protocolModel: ProtocolModel
  ) {
    this.results = this.resultsModel.getResults();
    this.protocol = this.protocolModel.getProtocolModel();
    this.state = this.stateModel.getState();

    this.update();
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

  update() {
    this.choices = _.cloneDeep((this.examService.currentPage?.responseArea as MultipleChoiceInterface).choices || this.yesNo);
    if ((this.examService.currentPage?.responseArea as MultipleChoiceInterface).other) {
      this.enableOther = true;
      this.choices.push({
        id: "Other",
        text: (this.examService.currentPage?.responseArea as MultipleChoiceInterface).other
      });
    }
    this.logger.debug("choices for multiple-choice responseArea" + this.choices);
  }

  choose(id: string) {
    this.results.currentPage.response = id;
    // this.state.isSubmittable = this.examService.getSubmittableLogic(this.examService.currentPage?.responseArea);
    this.state.isSubmittable = true;
    if (this.state.isSubmittable && this.results.currentPage.response !== "Other") {
      this.examService.submit = this.examService.submitDefault;
      this.examService.submit();
    }
  };

}
