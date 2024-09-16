import { Component } from '@angular/core';

import { DiskModel } from '../../models/disk/disk.service';
import { AppState, ExamState, ProtocolServer } from '../../utilities/constants';
import { DiskInterface } from '../../models/disk/disk.interface';
import { ProtocolModel } from '../../models/protocol/protocol-model.service';
import { StateModel } from '../../models/state/state.service';
import { StateInterface } from '../../models/state/state.interface';
import { ProtocolModelInterface } from '../../models/protocol/protocol.interface';
import { ResultsInterface } from '../../models/results/results.interface';
import { ResultsModel } from '../../models/results/results-model.service';
import { ExamService } from '../../controllers/exam.service';

@Component({
  selector: 'exam-view',
  templateUrl: './exam.component.html',
  styleUrl: './exam.component.css'
})

export class ExamComponent {
  disk: DiskInterface;
  results: ResultsInterface
  protocol: ProtocolModelInterface;
  localServer: ProtocolServer = ProtocolServer.LocalServer;
  state: StateInterface;
  ExamState = ExamState;

  constructor (
    public examService: ExamService,
    private diskModel: DiskModel,
    private resultsModel: ResultsModel,
    private protocolM: ProtocolModel,
    private stateModel: StateModel
  ) {
    this.disk = this.diskModel.getDisk();
    this.results = this.resultsModel.getResults();
    this.protocol = this.protocolM.getProtocolModel();
    this.state = this.stateModel.getState();
  }

  ngOnInit(): void {
    this.examService.switchToExamView();
    this.stateModel.setAppState(AppState.Exam);
  }

  ngOnDestroy(): void {
    this.stateModel.setAppState(AppState.null);
  }


  link(variable:any) {
    console.log("link button pressed");
  }


}
