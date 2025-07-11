import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs/internal/Subscription';

import { PageModel } from '../../../../../models/page/page.service';
import { DevicesService } from '../../../../../controllers/devices.service';
import { DialogType } from '../../../../../utilities/constants';
import { DeviceUtil } from '../../../../../utilities/device-utility';
import { Logger } from '../../../../../utilities/logger.service';
import { Notifications } from '../../../../../utilities/notifications.service';
import { ResultsModel } from '../../../../../models/results/results-model.service';
import { ExamService } from '../../../../../controllers/exam.service';
import { ResultsInterface } from '../../../../../models/results/results.interface';
import { PageInterface } from '../../../../../models/page/page.interface';
import { ConnectedDevice } from '../../../../../interfaces/connected-device.interface';
import { DialogDataInterface } from '../../../../../interfaces/dialog-data.interface';
import { MemrExamInterface, MemrQueueExamInterface, MemrExamSubmissionInterface, MemrResultsInterface } from './memr-exam.interface';
import { StateInterface } from '../../../../../models/state/state.interface';
import { StateModel } from '../../../../../models/state/state.service';
import { pageSchema } from '../../../../../../schema/page.schema';
import { memrSchema } from '../../../../../../schema/response-areas/memr.schema';

@Component({
  selector: 'memr-exam',
  templateUrl: './memr-exam.component.html',
  styleUrl: './memr-exam.component.css'
})
export class MemrExamComponent implements OnInit, OnDestroy {
  // Core Data
  results: ResultsInterface;
  state: StateInterface;
  memrResults?: MemrResultsInterface;
  memrExamProperties: MemrExamInterface = {
    type: memrSchema.properties.type.default,
    enableSkip: memrSchema.properties.enableSkip.default,
    responseRequired: memrSchema.properties.responseRequired.default,
    tabsintId: memrSchema.properties.tabsintId.default,
    exportToCSV: memrSchema.properties.exportToCSV.default,
    soundFileName: memrSchema.properties.soundFileName.default,
    recordFileName: memrSchema.properties.recordFileName.default,
    nRepeats: memrSchema.properties.nRepeats.default,
    useMetaRMS: memrSchema.properties.useMetaRMS.default,
    elicitorLevelChange: memrSchema.properties.elicitorLevelChange.default,
    elicitorLevelArray: memrSchema.properties.elicitorLevelArray.default,
    probeStimulusLevel: memrSchema.properties.probeStimulusLevel.default,
    submissionIntervalMs: memrSchema.properties.submissionIntervalMs.default,
    probeOutputChannel: memrSchema.properties.probeOutputChannel.default,
    elicitorOutputChannel: memrSchema.properties.elicitorOutputChannel.default,
  };
  inputParameterMap: Map<string, string> = new Map(); // Parameter map to display to the user in ready state

  // Configuration Variables
  isAutoSubmit: boolean = pageSchema.properties.isAutoSubmit.default;
  currentStep: string = 'Ready';
  shouldPollResults: boolean = false;

  // Controller variables
  instructions: string = 'Press submit to start the exam.';
  pctComplete: number = 0;

  // Subscriptions
  pageSubscription: Subscription | undefined;
  device: ConnectedDevice | undefined;

  constructor(
    private readonly devicesService: DevicesService,
    private readonly deviceUtil: DeviceUtil,
    private readonly examService: ExamService,
    private readonly logger: Logger,
    private readonly notifications: Notifications,
    private readonly pageModel: PageModel,
    private readonly resultsModel: ResultsModel,
    private readonly stateModel: StateModel,
  ) {
    this.state = this.stateModel.getState();
    this.results = this.resultsModel.getResults();
    this.examService.submit = this.nextStep.bind(this);
    this.state.isSubmittable = true;
  }

  ngOnInit(): void {
    this.pageSubscription = this.pageModel.currentPageSubject.subscribe(async (updatedPage: PageInterface) => {
      if (updatedPage?.responseArea?.type === 'memrResponseArea') {
        setTimeout(() => {
          this.isAutoSubmit = updatedPage.isAutoSubmit ?? this.isAutoSubmit;
          this.initializeResponseArea(updatedPage.responseArea as MemrExamInterface);
          this.setupDevice(updatedPage.responseArea as MemrExamInterface);
        });
      }
    });
  }

  ngOnDestroy(): void {
    // Wrap in IIFE to avoid mismatching return types
    (async () => {
      await this.abortExam();
      this.examService.submit = this.examService.submitDefault.bind(this.examService);
      this.pageSubscription?.unsubscribe();
    })();
  }



  /**
   * Update the state of the exam based on the current step.
   */
  public nextStep(): void {
    // Wrap in IIFE to avoid mismatching return types
    (async () => {
      switch (this.currentStep) {
        case 'Ready':
          await this.beginExam();
          this.instructions = 'Exam in progress. Please wait.';
          this.currentStep = 'Exam';
          this.state.isSubmittable = false;
          break;
        case 'Exam': {
          this.instructions = "Exam Complete. Press Submit to Save.";
          this.currentStep = 'Finish';
          this.state.isSubmittable = true;
          break;
        }
        case 'Finish': {
          await this.finishExam();
          break;
        }
      }
    })();
  }

  /**
   * Abort the exam and cancel any ongoing tasks.
   */
  private async abortExam(): Promise<void> {
    this.shouldPollResults = false;
    this.currentStep = 'Complete';
    let resp = await this.devicesService.abortExams(this.device!);
    this.logger.debug("resp from tympan after MEMR exam abort exams:" + resp);
  }

  /**
   * Finish the exam and cancel any ongoing tasks.
   */
  private async finishExam(): Promise<void> {
    this.shouldPollResults = false;
    this.currentStep = 'Complete';
    this.saveResults();
    this.examService.submitDefault();
    let resp = await this.devicesService.abortExams(this.device!);
    this.logger.debug("resp from tympan after MEMR exam abort exams:" + resp);
  }

  /**
   * Dialog to abort the currently running exam and save results.
   */
  public showCancelExamDialog() {
    let msg: DialogDataInterface = {
      title: "Confirm",
      content: "Cancel the MEMR exam",
      type: DialogType.Confirm
    };
    this.notifications.alert(msg).subscribe(async result => {
      if (result === "OK" && this.currentStep == "Exam") {
        await this.finishExam();
      }
    });
  }

  /**
   * Update the state of the exam based on the progress of completed trials.
   * 
   * @param trialsCompleted The number of trials which have been completed.
   * @param trialsTotal The total number of trials for the exam.
   */
  private updateExamProgress(trialsCompleted: number, trialsTotal: number) {
    this.pctComplete = trialsTotal == 0 ? 100 : (trialsCompleted / trialsTotal) * 100;
    if (trialsCompleted == trialsTotal) {
      if (this.isAutoSubmit) {
        this.finishExam();
      } else {
        this.nextStep();
      }
    }
  }


  /**
   * Poll the device for results and update the state of the exam.
   */
  private async pollTrialResults(): Promise<void> {
    this.shouldPollResults = true;
    const pollTrial = async () => {
      if (!this.shouldPollResults) return;
      try {
        let resp = await this.devicesService.requestResults(this.device!);
        if (resp != undefined && typeof resp[1] === 'object') {
          this.memrResults = {
            State: resp[1].State,
            NumTrialsComplete: resp[1].NumTrialsComplete,
            RecordedLevel_LeqdBSPL: resp[1].RecordedLevel_LeqdBSPL,
            RecordedLevel_dBP: resp[1].RecordedLevel_dBP,
          };
          this.updateExamProgress(resp[1].NumTrialsComplete, this.memrExamProperties.nRepeats ?? 0);
        }
      } catch (error) {
        this.logger.error("Error in polling trial results: " + JSON.stringify(error));
      }
      setTimeout(pollTrial, 500);
    };
    pollTrial();
  }

  private initializeResponseArea(responseArea: MemrExamInterface) {
    this.memrExamProperties = Object.assign(this.memrExamProperties, responseArea);
    this.inputParameterMap = new Map([
      ["Level Change", this.memrExamProperties.elicitorLevelChange?.toString() ?? ""],
      ["Sound File", this.memrExamProperties.soundFileName?.toString() ?? ""],
      ["Probe Stimulus Level", this.memrExamProperties.probeStimulusLevel?.toString() ?? ""],
      ["Elicitor Level Array", JSON.stringify(this.memrExamProperties.elicitorLevelArray ?? [])],
      ["Number of Trials", this.memrExamProperties.nRepeats?.toString() ?? ""],
      ["Submission Interval (ms)", this.memrExamProperties.submissionIntervalMs?.toString() ?? ""],
      ["Probe Output Channel", this.memrExamProperties.probeOutputChannel?.toString() ?? ""],
      ["Elicitor Output Channel", this.memrExamProperties.elicitorOutputChannel?.toString() ?? ""],
      ["Gain Scale", this.memrExamProperties.useMetaRMS?.toString() ?? ""],
      ["Results File", this.memrExamProperties.recordFileName?.toString() ?? ""],
    ]);
    this.results.currentPage.response = [];
  }

  private async setupDevice(updatedResponseArea: MemrExamInterface) {
    this.device = this.deviceUtil.getDeviceFromTabsintId(updatedResponseArea.tabsintId ?? "1");
  }

  private async beginExam() {
    if (this.device) {
      const examProperties: MemrQueueExamInterface = {
        OutputChannel: this.memrExamProperties.probeOutputChannel,
        InputChannel: this.memrExamProperties.elicitorOutputChannel,
      };
      await this.devicesService.queueExam(this.device, "PlayRecordExam", examProperties);
      await this.waitForReadyState();
      await this.examSubmission();
      this.pollTrialResults();
    } else {
      await this.devicesService.deviceNotFound();
      this.logger.error("Error setting up MEMR exam");
    }
  }

  /**
   * Submit exam data to the device to start the play/record functionality.
   */
  private async examSubmission() {
    let examProperties: MemrExamSubmissionInterface = {
      SoundFileName: this.memrExamProperties.soundFileName,
      UseMetaRMS: this.memrExamProperties.useMetaRMS,
      NumTrials: this.memrExamProperties.nRepeats,
      Level_dBSpl: this.memrExamProperties.elicitorLevelArray,
      RecordFileName: this.memrExamProperties.recordFileName,
      SubmissionInterval_ms: this.memrExamProperties.submissionIntervalMs,
      // Firmware implementations not available:
      // ProbStimulusLevel: this.memrExamProperties.probeStimulusLevel,
      // ElicitorLevelChange: this.memrExamProperties.elicitorLevelChange,
    };
    await this.devicesService.examSubmission(this.device!, examProperties);
  }

  /**
   * Poll the device for results until the device enters a ready state.
   */
  private async waitForReadyState(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const shouldPollResults = async () => {
        try {
          let resp = await this.devicesService.requestResults(this.device!);
          if (typeof resp![1] === 'object' && 'State' in resp![1]) {
            if (resp![1].State === "PLAYING") {
              setTimeout(shouldPollResults, 500);
            } else if (resp![1].State === "READY") {
              resolve();
            } else {
              this.logger.debug(
                "In memr-exam.component.ts waitForReadyState, unknown result state: " + resp![1]
              );
              reject(new Error("Unknown result state: " + resp![1].State));
            }
          }
        } catch (error) {
          this.logger.error("Error in waitForReadyState: " + error);
          const err = error instanceof Error ? error : new Error(String(error));
          reject(err);
        }
      };
      shouldPollResults();
    });
  };

  /**
   * Save the results for the current exam.
   */
  private saveResults(): void {
    this.results.currentPage.response.push(this.memrResults);
  }
}