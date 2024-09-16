import { Component } from '@angular/core';
import { ResultsInterface } from '../../models/results/results.interface';
import { ResultsModel } from '../../models/results/results-model.service';
import { ProtocolModel } from '../../models/protocol/protocol-model.service';
import { StateInterface } from '../../models/state/state.interface';
import { StateModel } from '../../models/state/state.service';
import { ProtocolModelInterface } from '../../models/protocol/protocol.interface';

@Component({
  selector: 'exam-ready-view',
  templateUrl: './exam-ready.component.html',
  styleUrl: './exam-ready.component.css'
})
export class ExamReadyComponent {
  results: ResultsInterface;
  state: StateInterface;
  protocol: ProtocolModelInterface;

  title?: string;
  subtitle?: string;
  instructionText?: string;

  constructor(
    private resultsModel: ResultsModel, 
    private stateModel: StateModel,
    private protocolModel: ProtocolModel
  ) { 
    this.results = this.resultsModel.getResults();
    this.state = this.stateModel.getState();
    this.protocol = this.protocolModel.getProtocolModel();

    this.title = this.protocol.activeProtocol?.title;
    this.subtitle = this.protocol.activeProtocol?.subtitle;
    this.instructionText = this.protocol.activeProtocol?.instructionText;
  }

}
