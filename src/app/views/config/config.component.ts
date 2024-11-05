import { Component } from '@angular/core';
import { Logger } from '../../utilities/logger.service';
import { AppState } from '../../utilities/constants';
import { StateModel } from '../../models/state/state.service';
import { StateInterface } from '../../models/state/state.interface';
import { ExamService } from '../../controllers/exam.service';

@Component({
  selector: 'config-view',
  templateUrl: './config.component.html',
  styleUrl: './config.component.css'
})
export class ConfigComponent {
  state: StateInterface;

  constructor(
    private readonly examService: ExamService,
    private readonly logger: Logger, 
    private readonly stateModel: StateModel
  ) { 
    this.state = this.stateModel.getState();
  }

  ngOnInit(): void {
    this.examService.switchToAdminView();
    this.state.appState = AppState.Admin;
  }

  title = 'config';

  // TEST FUNCTIONS
  logTest() {
    this.logger.debug("test");
  }

}
