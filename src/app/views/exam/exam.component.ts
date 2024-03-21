import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

import { DiskModel } from '../../models/disk/disk.service';
import { AppState } from '../../utilities/constants';
import { Logger } from '../../utilities/logger.service';
import { ProtocolInterface } from '../../models/protocol/protocol.interface';
import { ProtocolServer } from '../../utilities/constants';
import { DiskInterface } from '../../models/disk/disk.interface';
import { ProtocolModel } from '../../models/protocol/protocol.service';
import { ProtocolService } from '../../controllers/protocol.service';
import { StateModel } from '../../models/state/state.service';
import { StateInterface } from '../../models/state/state.interface';
import { Notifications } from '../../utilities/notifications.service';
import { Tasks } from '../../utilities/tasks.service';
import { AdminService } from '../../controllers/admin.service';
import { ProtocolModelInterface } from '../../models/protocol/protocol-model.interface';
import { ResultsInterface } from '../../models/results/results.interface';
import { ResultsModel } from '../../models/results/results.service';
import { ExamService } from '../../controllers/exam.service';

@Component({
  selector: 'exam-view',
  templateUrl: './exam.component.html',
  styleUrl: './exam.component.css'
})

export class ExamComponent {
  disk: DiskInterface;
  results: ResultsInterface
  protocolModel: ProtocolModelInterface;
  localServer: ProtocolServer = ProtocolServer.LocalServer;
  state: StateInterface;

  constructor (
    public diskModel: DiskModel,
    public resultsModel: ResultsModel,
    public protocolService: ProtocolService,
    public protocolM: ProtocolModel,
    public stateModel: StateModel,
    private translate: TranslateService,
    private logger: Logger,
    private notifications: Notifications,
    private tasks: Tasks,
    public adminService: AdminService,
    public examService: ExamService
  ) {
    this.disk = this.diskModel.getDisk();
    this.results = this.resultsModel.getResults();
    this.protocolModel = this.protocolM.getProtocolModel();
    this.state = this.stateModel.getState();
  }

  ngOnInit(): void {
    this.stateModel.setAppState(AppState.Exam);
  }

  ngOnDestroy(): void {
    this.stateModel.setAppState(AppState.null);
  }


  link(variable:any) {
    console.log("link button pressed");
  }


}
