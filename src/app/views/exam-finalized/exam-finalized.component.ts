import { Component } from '@angular/core';

import { ExamResults, ResultsInterface } from '../../models/results/results.interface';
import { ResultsModel } from '../../models/results/results-model.service';
import { DiskInterface } from '../../models/disk/disk.interface';
import { DiskModel } from '../../models/disk/disk.service';
import { ProtocolModel } from '../../models/protocol/protocol-model.service';
import { ProtocolModelInterface } from '../../models/protocol/protocol.interface';

@Component({
  selector: 'exam-finalized-view',
  templateUrl: './exam-finalized.component.html',
  styleUrl: './exam-finalized.component.css',
})
export class ExamFinalizedComponent {
  results: ResultsInterface;
  disk: DiskInterface;
  protocol: ProtocolModelInterface;
  title?: string;
  currentExam: ExamResults;

  constructor(
    private resultsModel: ResultsModel, 
    private diskModel: DiskModel,
    private protocolModel: ProtocolModel
  ) { 
    this.results = this.resultsModel.getResults();
    this.disk = this.diskModel.getDisk();
    this.protocol = this.protocolModel.getProtocolModel();

    this.title = this.protocol.activeProtocol?.title;
    this.currentExam = this.results.currentExam;
  }

}
