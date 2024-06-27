import { Component } from '@angular/core';
import { ProtocolModel } from '../../models/protocol/protocol-model.service';
import { StateInterface } from '../../models/state/state.interface';
import { StateModel } from '../../models/state/state.service';
import { ProtocolModelInterface } from '../../models/protocol/protocol.interface';
import { ExamService } from '../../controllers/exam.service';

@Component({
  selector: 'response-area',
  templateUrl: './response-area.component.html',
  template: 'response-area',
  styleUrl: './response-area.component.css'
})
export class ResponseAreaComponent {
  state: StateInterface;
  protocol: ProtocolModelInterface;

  constructor (
    public stateModel: StateModel,
    public protocolModel: ProtocolModel,
    public examService: ExamService
  ) {
    this.state = this.stateModel.getState();
    this.protocol = this.protocolModel.getProtocolModel();
  }
}
