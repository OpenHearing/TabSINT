import { Component } from '@angular/core';
import { Subscription } from 'rxjs';

import { DiskInterface } from '../../models/disk/disk.interface';
import { StateInterface } from '../../models/state/state.interface';
import { ProtocolModelInterface } from '../../models/protocol/protocol.interface';
import { ResultsInterface } from '../../models/results/results.interface';

import { DiskModel } from '../../models/disk/disk.service';
import { ProtocolModel } from '../../models/protocol/protocol-model.service';
import { StateModel } from '../../models/state/state.service';
import { ResultsModel } from '../../models/results/results-model.service';
import { ExamService } from '../../controllers/exam.service';

import { AppState, ExamState, ProtocolServer } from '../../utilities/constants';

@Component({
  selector: 'exam-view',
  templateUrl: './exam.component.html',
  styleUrl: './exam.component.css'
})

export class ExamComponent {
  disk: DiskInterface;
  diskSubscription: Subscription | undefined;
  results: ResultsInterface
  protocol: ProtocolModelInterface;
  localServer: ProtocolServer = ProtocolServer.LocalServer;
  state: StateInterface;
  ExamState = ExamState;

  constructor (
    public examService: ExamService,
    private readonly diskModel: DiskModel,
    private readonly protocolM: ProtocolModel,
    private readonly resultsModel: ResultsModel,
    private readonly stateModel: StateModel
  ) {
    this.disk = this.diskModel.getDisk();
    this.results = this.resultsModel.getResults();
    this.protocol = this.protocolM.getProtocolModel();
    this.state = this.stateModel.getState();
  }

  ngOnInit(): void {
    this.diskSubscription = this.diskModel.diskSubject.subscribe( (updatedDisk: DiskInterface) => {
        this.disk = updatedDisk;
    })    
    this.examService.switchToExamView();
    this.stateModel.setAppState(AppState.Exam);
  }

  ngOnDestroy(): void {
    this.diskSubscription?.unsubscribe();
    this.stateModel.setAppState(AppState.null);
  }


  link(variable:any) {
    console.log("link button pressed");
  }


}
