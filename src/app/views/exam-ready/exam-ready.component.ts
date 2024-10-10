import { Component } from '@angular/core';
import { ProtocolModel } from '../../models/protocol/protocol-model.service';
import { ProtocolModelInterface } from '../../models/protocol/protocol.interface';

@Component({
  selector: 'exam-ready-view',
  templateUrl: './exam-ready.component.html',
  styleUrl: './exam-ready.component.css'
})

export class ExamReadyComponent {
  protocol: ProtocolModelInterface;
  title?: string;
  subtitle?: string;
  instructionText?: string;

  constructor(private readonly protocolModel: ProtocolModel) {
    this.protocol = this.protocolModel.getProtocolModel();

    this.title = this.protocol.activeProtocol?.title;
    this.subtitle = this.protocol.activeProtocol?.subtitle;
    this.instructionText = this.protocol.activeProtocol?.instructionText;
  }

}
