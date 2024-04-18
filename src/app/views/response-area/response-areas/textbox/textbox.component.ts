import { Component } from '@angular/core';

import { ExamService } from '../../../../controllers/exam.service';
import { ResultsInterface } from '../../../../models/results/results.interface';
import { ResultsModel } from '../../../../models/results/results.service';
import { ProtocolModel } from '../../../../models/protocol/protocol.service';
import { ProtocolModelInterface } from '../../../../models/protocol/protocol-model.interface';
import { StateInterface } from '../../../../models/state/state.interface';
import { StateModel } from '../../../../models/state/state.service';

@Component({
  selector: 'textbox-view',
  templateUrl: './textbox.component.html',
  styleUrl: './textbox.component.css'
})
export class TextboxComponent {
  results: ResultsInterface;
  protocol: ProtocolModelInterface;
  state: StateInterface
  rows: number;

  constructor (public resultsModel: ResultsModel, public examService: ExamService, public protocolModel: ProtocolModel, public stateModel: StateModel) {
    this.results = this.resultsModel.getResults();
    this.protocol = this.protocolModel.getProtocolModel();
    this.state = this.stateModel.getState();


    // TODO: Update this to get the correct number
    this.rows = 1;
  }

}
