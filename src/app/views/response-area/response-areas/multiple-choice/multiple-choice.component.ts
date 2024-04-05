import { Component } from '@angular/core';
import * as _ from 'lodash';

import { ExamService } from '../../../../controllers/exam.service';
import { ResultsInterface } from '../../../../models/results/results.interface';
import { ResultsModel } from '../../../../models/results/results.service';
import { ProtocolModelInterface } from '../../../../models/protocol/protocol-model.interface';
import { StateInterface } from '../../../../models/state/state.interface';
import { StateModel } from '../../../../models/state/state.service';
import { ProtocolModel } from '../../../../models/protocol/protocol.service';

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

  choices:any = {};
  choice:any = {};
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
    this.choices = _.cloneDeep(this.examService.currentPage?.responseArea.choices || this.yesNo);
    if (this.examService.currentPage?.responseArea.other) {
      this.enableOther = true;
      this.choices.push({
        id: "Other",
        text: this.examService.currentPage?.responseArea.other
      });
    }
    console.log("choices",this.choices);
  }

  choose(id:any) {
    this.results.current.response = id;
    // this.state.isSubmittable = this.examService.getSubmittableLogic(this.examService.currentPage?.responseArea);
    this.state.isSubmittable = true;
    console.log("this.state.isSubmittable",this.state.isSubmittable);
    if (this.state.isSubmittable && this.results.current.response !== "Other") {
      this.examService.submit = this.examService.submitDefault;
      this.examService.submit();
    }
  };

}
