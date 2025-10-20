import { Component } from '@angular/core';
import { Logger } from '../../services/logger.service';
import { AppState } from '../../utilities/constants';
import { StateModel } from '../../models/state/state.service';
import { StateInterface } from '../../models/state/state.interface';
import { ExamService } from '../../controllers/exam.service';
import { Subscription } from 'rxjs/internal/Subscription';

@Component({
  selector: 'config-view',
  templateUrl: './config.component.html',
  styleUrl: './config.component.css'
})
export class ConfigComponent {
  state: StateInterface;
  stateSubscription: Subscription | undefined;

  constructor(
    private readonly examService: ExamService,
    private readonly logger: Logger, 
    private readonly stateModel: StateModel
  ) { 
    this.state = this.stateModel.getState();
  }

  ngOnInit(): void {
    this.stateSubscription = this.stateModel.stateSubject.subscribe( (updatedState) => {
      this.state = updatedState;
    });
    this.examService.switchToAdminView();
    this.stateModel.updateState({appState: AppState.Admin});
  }

  ngOnDestroy(): void {
    this.stateSubscription?.unsubscribe();
  }

  title = 'config';

  // TEST FUNCTIONS
  logTest() {
    this.logger.debug("test");
  }

}
