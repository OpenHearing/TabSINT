import { Component } from '@angular/core';
import { Subscription } from 'rxjs';

import { ExamResults, ResultsInterface } from '../../models/results/results.interface';
import { ProtocolModelInterface } from '../../models/protocol/protocol.interface';
import { DiskInterface } from '../../models/disk/disk.interface';

import { ResultsModel } from '../../models/results/results-model.service';
import { DiskModel } from '../../models/disk/disk.service';
import { ProtocolModel } from '../../models/protocol/protocol-model.service';

@Component({
  selector: 'exam-finalized-view',
  templateUrl: './exam-finalized.component.html',
  styleUrl: './exam-finalized.component.css',
})
export class ExamFinalizedComponent {
  results: ResultsInterface;
  disk: DiskInterface;
  diskSubscription: Subscription | undefined;
  protocol: ProtocolModelInterface;
  title?: string;
  currentExam: ExamResults;

  constructor(
    private readonly diskModel: DiskModel, 
    private readonly protocolModel: ProtocolModel,
    private readonly resultsModel: ResultsModel
  ) { 
    this.results = this.resultsModel.getResults();
    this.disk = this.diskModel.getDisk();
    this.protocol = this.protocolModel.getProtocolModel();

    this.title = this.protocol.activeProtocol?.title;
    this.currentExam = this.results.currentExam;
  }

  ngOnInit() {
    this.diskSubscription = this.diskModel.diskSubject.subscribe( (updatedDisk: DiskInterface) => {
        this.disk = updatedDisk;
    })    
  }

  ngOnDestroy() {
    this.diskSubscription?.unsubscribe();
  }

  truncatedResponse(resp: any) {
    if (typeof resp.response === 'string') {
      return resp.response.substr(0, 25);
    }
    return '';
  }

}
