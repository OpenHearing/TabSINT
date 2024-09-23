import { Component } from '@angular/core';
import { DiskModel } from '../../models/disk/disk.service';
import { Logger } from '../../utilities/logger.service';
import { AppState } from '../../utilities/constants';
import { StateModel } from '../../models/state/state.service';
import { DiskInterface } from '../../models/disk/disk.interface';
import { StateInterface } from '../../models/state/state.interface';
import { ExamService } from '../../controllers/exam.service';

@Component({
  selector: 'config-view',
  templateUrl: './config.component.html',
  styleUrl: './config.component.css'
})
export class ConfigComponent {
  disk: DiskInterface;
  state: StateInterface;

  constructor(
    private diskModel: DiskModel, 
    private examService: ExamService,
    private logger: Logger, 
    private stateModel: StateModel
  ) { 
    this.disk = this.diskModel.getDisk();
    this.state = this.stateModel.getState();
  }

  ngOnInit(): void {
    this.examService.switchToAdminView();
    this.stateModel.setAppState(AppState.Admin);
  }

  title = 'config';

  // TEST FUNCTIONS
  logTest() {
    this.logger.debug("diskM: "+JSON.stringify(this.disk));
  }

}
