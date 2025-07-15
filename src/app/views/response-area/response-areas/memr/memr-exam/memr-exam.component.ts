import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs/internal/Subscription';
import { PageModel } from '../../../../../models/page/page.service';
import { DevicesService } from '../../../../../controllers/devices.service';
import { DialogType } from '../../../../../utilities/constants';
import { DeviceUtil } from '../../../../../utilities/device-utility';
import { Paths } from '../../../../../utilities/paths.service';
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
    recordFileFolder: memrSchema.properties.recordFileFolder.default,
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
  trialsPerBlock: number = 0;
  blockCount: number = 0;
  blocksComplete: number = 0;

  // Configuration Variables
  isAutoSubmit: boolean = pageSchema.properties.isAutoSubmit.default;
  currentStep: string = 'Ready';
  chinchillaType = "Chinchilla";
  humanType = "Human";

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
    private readonly paths: Paths,
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
   * Determine if the elicitor level change type is within block.
   * 
   * @returns Whether the elicitor level change type is within block.
   */
  private isWithinBlock(): boolean {
    return this.memrExamProperties.elicitorLevelChange === "Within Block";
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
    this.currentStep = 'Complete';
    let resp = await this.devicesService.abortExams(this.device!);
    this.logger.debug("resp from tympan after MEMR exam abort exams:" + resp);
  }

  /**
   * Finish the exam and cancel any ongoing tasks.
   */
  private async finishExam(): Promise<void> {
    this.saveResults();
    this.examService.submitDefault();
    await this.abortExam();
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
   * Initialize response area and parameter map for initial exam page.
   */
  private initializeResponseArea(responseArea: MemrExamInterface) {
    this.memrExamProperties = Object.assign(this.memrExamProperties, responseArea);
    this.results.currentPage.response = [];
    this.trialsPerBlock = (this.isWithinBlock() ? this.memrExamProperties.elicitorLevelArray?.length : this.memrExamProperties.nRepeats) ?? this.trialsPerBlock;
    this.blockCount = (this.isWithinBlock() ? this.memrExamProperties.nRepeats : this.memrExamProperties.elicitorLevelArray?.length) ?? this.blockCount;
    const subjectType = this.isWithinBlock() ? this.chinchillaType : this.humanType;
    this.inputParameterMap = new Map([
      ["Level Change", this.memrExamProperties.elicitorLevelChange?.toString() ?? ""],
      ["Subject Type", subjectType],
      ["Number of Blocks", this.blockCount?.toString() ?? ""],
      ["Number of Trials Per Block", this.trialsPerBlock?.toString() ?? ""],
      ["Elicitor Level Array", JSON.stringify(this.memrExamProperties.elicitorLevelArray ?? [])],
      ["Probe Stimulus Level", this.memrExamProperties.probeStimulusLevel?.toString() ?? ""],
      ["Submission Interval (ms)", this.memrExamProperties.submissionIntervalMs?.toString() ?? ""],
      ["Probe Output Channel", JSON.stringify(this.memrExamProperties.probeOutputChannel ?? [])],
      ["Elicitor Output Channel", JSON.stringify(this.memrExamProperties.elicitorOutputChannel ?? [])],
      ["Gain Scale", this.memrExamProperties.useMetaRMS?.toString() ?? ""],
      ["Sound File", this.memrExamProperties.soundFileName?.toString() ?? ""],
      ["Results File", this.memrExamProperties.recordFileName?.toString() ?? ""],
      ["Results Folder", this.memrExamProperties.recordFileFolder?.toString() ?? ""],
    ]);
  }

  /**
   * Get the the device for the exam.
   * @param updatedResponseArea The response area used to determine the device id.
   */
  private async setupDevice(updatedResponseArea: MemrExamInterface) {
    this.device = this.deviceUtil.getDeviceFromTabsintId(updatedResponseArea.tabsintId ?? "1");
  }

  /**
   * Begin the exam for the connected device.
   */
  private async beginExam() {
    if (this.device) {
      const examProperties: MemrQueueExamInterface = {
        InputChannel: this.memrExamProperties.elicitorOutputChannel,
        OutputChannel: this.memrExamProperties.probeOutputChannel,
      };
      await this.devicesService.queueExam(this.device, "PlayRecordExam", examProperties);
      await this.runExamSubmissions();
    } else {
      await this.devicesService.deviceNotFound();
      this.logger.error("Error running the MEMR exam");
    }
  }

  /**
   * Submit exam data to the device to start the play/record functionality.
   */
  private async examSubmission() {
    // Compute block data based on change type (2D Array Data: CH 0: Elicitor, CH 1: Probe)
    const blockData = this.isWithinBlock() ?
      this.memrExamProperties.elicitorLevelArray?.map(value => [value, this.memrExamProperties.probeStimulusLevel]) :
      Array(this.memrExamProperties.nRepeats).fill([this.memrExamProperties.elicitorLevelArray?.at(this.blocksComplete), this.memrExamProperties.probeStimulusLevel]);

    let examProperties: MemrExamSubmissionInterface = {
      SoundFileName: this.memrExamProperties.soundFileName,
      UseMetaRMS: this.memrExamProperties.useMetaRMS,
      NumTrials: this.trialsPerBlock,
      Level_dBSpl: blockData,
      RecordFileName: this.getRecordBlockPath(this.blocksComplete),
      SubmissionInterval_ms: this.memrExamProperties.submissionIntervalMs,
    };
    await this.devicesService.examSubmission(this.device!, examProperties);
  }

  /**
   * Update the state of the exam based on the progress of completed trials.
   * 
   * @param results The MEMR request results response.
   */
  private async updateExamProgress(results: MemrResultsInterface) {
    this.memrResults = {
      State: results.State,
      NumTrialsComplete: results.NumTrialsComplete,
      RecordedLevel_LeqdBSPL: results.RecordedLevel_LeqdBSPL,
      RecordedLevel_dBP: results.RecordedLevel_dBP,
    };
    const trialsTotal = this.trialsPerBlock * this.blockCount;
    this.pctComplete = trialsTotal == 0 ? 100 : (results.NumTrialsComplete / trialsTotal) * 100;
    this.blocksComplete = results.NumTrialsComplete % this.trialsPerBlock;
    if (results.NumTrialsComplete == this.trialsPerBlock * this.blockCount) {
      if (this.isAutoSubmit) {
        await this.finishExam();
      } else {
        this.nextStep();
      }
    }
  }

  /**
   * Poll the device for results until the device enters a ready state.
   */
  private async runExamSubmissions(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const shouldPollResults = async () => {
        try {
          let resp = await this.devicesService.requestResults(this.device!);
          if (typeof resp![1] === 'object' && 'State' in resp![1]) {
            if (resp![1].State === "PLAYING" || resp![1].State === "WAITING") {
              await this.updateExamProgress(resp![1]);
              if (resp![1].NumTrialsComplete == this.trialsPerBlock * this.blockCount) {
                resolve();
              } else {
                setTimeout(shouldPollResults, 500);
              }
            } else if (resp![1].State === "READY") {
              await this.examSubmission();
              setTimeout(shouldPollResults, 500);
            } else {
              this.logger.debug(
                "In memr-exam.component.ts runExamSubmissions, unknown result state: " + resp![1]
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

  /**
   * Get the record path for the block with the specified index included.
   * @param index The index to be added to the block record path.
   */
  private getRecordBlockPath(index: number): string {
    const recordFolder = this.memrExamProperties.recordFileFolder ?? "";
    const recordFileName = this.memrExamProperties.recordFileName ?? "";
    return this.paths.join(recordFolder, `blk${index.toString().padStart(3, '0')}`, recordFileName);
  }
}