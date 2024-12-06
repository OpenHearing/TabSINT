import { Component } from '@angular/core';
import { StateModel } from '../../models/state/state.service';
import { AppState, DialogType, ExamState } from '../../utilities/constants';
import { DialogDataInterface } from '../../interfaces/dialog-data.interface';
import { Notifications } from '../../utilities/notifications.service';
import { ExamService } from '../../controllers/exam.service';
import { Logger } from '../../utilities/logger.service';
import { StateInterface } from '../../models/state/state.interface';
import { ProtocolModel } from '../../models/protocol/protocol-model.service';
import { ProtocolModelInterface } from '../../models/protocol/protocol.interface';
import { NavMenuInterface } from '../../interfaces/page-definition.interface';
import { isProtocolReferenceInterface } from '../../guards/type.guard';

@Component({
  selector: 'header-view',
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent {
  state: StateInterface;
  protocol: ProtocolModelInterface;
  ExamState = ExamState;
  AppState = AppState;
  
  constructor(
    private readonly examService: ExamService,
    private readonly logger: Logger,
    private readonly notifications: Notifications,
    private readonly protocolM: ProtocolModel,
    private readonly stateModel: StateModel
  ) {
    this.state = this.stateModel.getState();
    this.protocol = this.protocolM.getProtocolModel();
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

  navigateToNavMenuItem(navMenuItem: NavMenuInterface) {
    const contentStr = navMenuItem.returnHereAfterward
      ? "TabSINT will navigate to the selected sub-protocol, then return to this page and resume the current series of questions after that sub-protocol is complete."
      : "Results from this page will be lost and the current series of questions will be aborted."
    let msg: DialogDataInterface = {
      title: navMenuItem.text + "?",
      content: contentStr,
      type: DialogType.Confirm
    };
    this.notifications.alert(msg).subscribe(async (result: string) => {
      if (result === "OK") {
        if (isProtocolReferenceInterface(navMenuItem.target)) {
          this.examService.navigateToTarget(navMenuItem.target.reference);
        } else {
          this.logger.debug('navigateToNavMenuItem() not implemented for inline pages or subprotocol, only for protocol reference.')
        }        
      } else {
        this.logger.debug('navigateToNavMenuItem() canceled.');
      }
    });
  }

}
