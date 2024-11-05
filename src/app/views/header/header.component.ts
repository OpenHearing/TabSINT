import { Component } from '@angular/core';
import { StateModel } from '../../models/state/state.service';
import { AppState, DialogType, ExamState } from '../../utilities/constants';
import { DialogDataInterface } from '../../interfaces/dialog-data.interface';
import { Notifications } from '../../utilities/notifications.service';
import { ExamService } from '../../controllers/exam.service';
import { Logger } from '../../utilities/logger.service';
import { Subscription } from 'rxjs';
import { StateInterface } from '../../models/state/state.interface';

@Component({
  selector: 'header-view',
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent {
  stateModelSubscription: Subscription | undefined;
  isExam: boolean = false;
  isTesting: boolean = false;
  
  constructor(
    private readonly examService: ExamService,
    private readonly logger: Logger,
    private readonly notifications: Notifications,
    private readonly stateModel: StateModel
  ) {}

  ngOnInit(): void {
    this.stateModelSubscription = this.stateModel.stateModelSubject.subscribe( (updatedStateModel: StateInterface) => {
      this.isExam = updatedStateModel.appState === AppState.Exam;
      this.isTesting = updatedStateModel.examState === ExamState.Testing;
    })
  }

  ngOnDestroy(): void {
    this.stateModelSubscription?.unsubscribe();
  }

  resetExam() {
    let msg: DialogDataInterface = {
      title: "Confirm Exam Reset",
      content: "Are you sure you want to reset the exam and discard partial results?",
      type: DialogType.Confirm
    };
    this.notifications.alert(msg).subscribe(async (result: string) => {
      if (result === "OK") {
        this.examService.reset();
      } else {
        this.logger.debug('Reset exam canceled.');
      }
    });
  }

  submitPartialExam() {
    let msg: DialogDataInterface = {
      title: "Confirm Submit Partial Results",
      content: "Are you sure you want to reset the exam and submit partial results?",
      type: DialogType.Confirm
    };
    this.notifications.alert(msg).subscribe(async (result: string) => {
      if (result === "OK") {
        this.examService.submitPartial();
      } else {
        this.logger.debug('Reset exam canceled.');
      }
    });
  }

}
