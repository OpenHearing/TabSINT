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
  currentBlockIndex: number = -1;
  device: ConnectedDevice | undefined;

  // Configuration Variables
  isAutoSubmit: boolean = pageSchema.properties.isAutoSubmit.default;
  currentStep: string = 'Ready';
  chinchillaType = "Chinchilla";
  humanType = "Human";
  knownStates = ["OFF", "PLAYING", "POSTTRIAL", "READY", "POSTBLOCK"];

  // Controller variables
  instructions: string = 'Press submit to start the exam.';
  pctComplete: number = 0;
  blocksComplete: number = 0;

  // Subscriptions
  pageSubscription: Subscription | undefined;
  stateSubscription: Subscription | undefined;
  resultsSubscription: Subscription | undefined;

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
    this.examService.submit = () => { !this.devicesService.isDeviceMessagePending(this.device) && this.nextStep(); };
    this.examService.reset = () => { !this.devicesService.isDeviceMessagePending(this.device) && this.examService.resetDefault(); };
    this.examService.submitPartial = () => { !this.devicesService.isDeviceMessagePending(this.device) && this.examService.submitPartialDefault(); };
    this.stateModel.updateState({ isSubmittable: true });
  }

  ngOnInit(): void {
    this.stateSubscription = this.stateModel.stateSubject.subscribe((updatedState) => {
      this.state = updatedState;
    });
    this.resultsSubscription = this.resultsModel.resultsSubject.subscribe((updatedResults) => {
      this.results = updatedResults;
    });
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
      this.examService.reset = this.examService.resetDefault.bind(this.examService);
      this.examService.submitPartial = this.examService.submitPartialDefault.bind(this.examService);
      this.pageSubscription?.unsubscribe();
      this.resultsSubscription?.unsubscribe();
      this.stateSubscription?.unsubscribe();
    })();
  }

  /**
   * Function to provide an artificial delay.
   * 
   * @param ms Delay time in milliseconds.
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
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
          this.stateModel.updateState({ isSubmittable: false });
          break;
        case 'Exam': {
          this.instructions = "Exam Complete. Press Submit to Save.";
          this.currentStep = 'Finish';
          this.stateModel.updateState({ isSubmittable: true });
          break;
        }
        case 'Finish': {
          await this.finishExam();
          break;
        }
      }
    })();
  }

  /* Get the record channels as an array from inputParameterMap
  * @returns Array of channel names
  */
  getRecordChannelsArray(): string[] {
    const channelsString = this.inputParameterMap.get('Record Channels') ?? '[]';
    try {
      const parsed = JSON.parse(channelsString);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      this.logger.error('Error parsing record channels: ' + error);
      return [];
    }
  }

  /**
   * Get the recorded Leq level for a specific channel index
   * @param index Channel index
   * @returns Recorded Leq level or 'N/A'
   */
  getRecordedLevelLeq(index: number): string {
    if (this.memrResults?.RecordedLeq_dBSPL &&
      Array.isArray(this.memrResults.RecordedLeq_dBSPL) &&
      index < this.memrResults.RecordedLeq_dBSPL.length) {
      return this.memrResults.RecordedLeq_dBSPL[index].toFixed(1);
    }
    return 'N/A';
  }

  /**
   * Get the recorded peak level for a specific channel index
   * @param index Channel index
   * @returns Recorded peak level or 'N/A'
   */
  getRecordedLevelPeak(index: number): string {
    if (this.memrResults?.RecordedPeak_dBP &&
      Array.isArray(this.memrResults.RecordedPeak_dBP) &&
      index < this.memrResults.RecordedPeak_dBP.length) {
      return this.memrResults.RecordedPeak_dBP[index].toFixed(1);
    }
    return 'N/A';
  }

  /**
   * Dialog to abort the currently running exam and save results.
   */
  public showCancelExamDialog(): void {
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
   * Abort the exam and cancel any ongoing tasks.
   */
  private async abortExam(): Promise<void> {
    this.currentStep = 'Complete';
    let resp = this.device ? await this.devicesService.abortExams(this.device) : undefined;
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
   * Initialize response area and parameter map for initial exam page.
   */
  private initializeResponseArea(responseArea: MemrExamInterface): void {
    this.memrExamProperties = Object.assign(this.memrExamProperties, responseArea);
    this.resultsModel.updateCurrentPage({ response: [] });
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
      ["Probe Output Channel", JSON.stringify(this.memrExamProperties.probeOutputChannel ?? memrSchema.properties.probeOutputChannel.default)],
      ["Elicitor Output Channel", JSON.stringify(this.memrExamProperties.elicitorOutputChannel ?? memrSchema.properties.elicitorOutputChannel.default)],
      ["Record Channels", JSON.stringify(this.memrExamProperties.recordChannels ?? memrSchema.properties.recordChannels.default)],
      ["Gain Scale", this.memrExamProperties.useMetaRMS?.toString() ?? ""],
      ["Sound File", this.memrExamProperties.soundFileName?.toString() ?? ""],
      ["Results File", this.memrExamProperties.recordFileName?.toString() ?? ""],
      ["Results Folder", this.memrExamProperties.recordFileFolder?.toString() ?? ""],
    ]);
  }

  /**
   * Set up the device id for the exam.
   * @param updatedResponseArea The response area used to determine the device id.
   */
  private setupDevice(updatedResponseArea: MemrExamInterface): void {
    this.device = this.deviceUtil.getDeviceFromTabsintId(updatedResponseArea.tabsintId ?? "1");
  }

  /**
   * Begin the exam for the connected device.
   */
  private async beginExam(): Promise<void> {
    if (this.device) {
      const examProperties: MemrQueueExamInterface = {
        PlaybackChannels: [...this.memrExamProperties.elicitorOutputChannel!, ...this.memrExamProperties.probeOutputChannel!],
        RecordChannels: this.memrExamProperties.recordChannels,
      };
      await this.devicesService.queueExam(this.device, "PlayRecordExam", examProperties);
      this.startPollingResults();
    } else {
      await this.devicesService.deviceNotFound();
      this.logger.error("Error running the MEMR exam");
    }
  }

  /**
   * Submit exam data to the device to start the play/record functionality when ready and check for exam completion.
   */
  private async handleReadyState(results: MemrResultsInterface): Promise<void> {
    this.currentBlockIndex += 1; // Increment the current block
    this.updateExamProgress(results); // Update UI components
    if (this.currentBlockIndex >= this.blockCount) {
      await this.delay(1000); // Delay to show final block count to the user before the next step
      if (this.isAutoSubmit) {
        await this.finishExam();
      } else {
        this.nextStep();
      }
      return;
    }
    // Compute block data based on change type (2D Array Data: CH 0: Elicitor, CH 1: Probe)
    const blockData = this.isWithinBlock() ?
      this.memrExamProperties.elicitorLevelArray?.map(value => [value, this.memrExamProperties.probeStimulusLevel]) :
      Array(this.memrExamProperties.nRepeats).fill([this.memrExamProperties.elicitorLevelArray?.at(this.currentBlockIndex), this.memrExamProperties.probeStimulusLevel]);

    let examProperties: MemrExamSubmissionInterface = {
      SoundFileName: this.memrExamProperties.soundFileName,
      UseMetaRMS: this.memrExamProperties.useMetaRMS,
      NumTrials: this.trialsPerBlock,
      Level_dBSpl: blockData,
      RecordFileName: this.getRecordBlockPath(this.currentBlockIndex),
      SubmissionInterval_ms: this.memrExamProperties.submissionIntervalMs
      // NumOutputChans: this.memrExamProperties.probeOutputChannel?.length
    };
    if (this.device) {
      await this.devicesService.examSubmission(this.device, examProperties);
    } else {
      await this.finishExam();
      this.logger.error("Error in the examSubmission, finishing exam.");
    }
  }

  /**
   * Update the state of the exam based on the progress of completed trials and blocks.
   * 
   * @param results The MEMR request results response.
   */
  private async updateExamProgress(results: MemrResultsInterface): Promise<void> {
    this.memrResults = {
      State: results.State,
      TrialsCompleted: results.TrialsCompleted,
      RecordedLeq_dBSPL: results.RecordedLeq_dBSPL,
      RecordedPeak_dBP: results.RecordedPeak_dBP,
    };
    if (results.State === "READY") {
      // Block based percentage calculation
      this.pctComplete = this.blockCount == 0 ? 100 : (this.currentBlockIndex / this.blockCount) * 100;
    } else {
      // Trial based percentage calculation
      const trialsTotal = this.trialsPerBlock * this.blockCount;
      const previousTrialsComplete = this.currentBlockIndex * this.trialsPerBlock;
      this.pctComplete = trialsTotal == 0 ? 100 : ((results.TrialsCompleted + previousTrialsComplete) / trialsTotal) * 100;
    }
    this.blocksComplete = Math.max(this.currentBlockIndex, 0);
  }

  /**
   * Poll the device for results and update progress.
   */
  private startPollingResults(): void {
    const pollResults = async () => {
      try {
        let resp = this.device ? await this.devicesService.requestResults(this.device) : undefined;
        if (typeof resp![1] === 'object' && 'State' in resp![1] && this.knownStates.includes(resp![1].State)) {
          if (resp![1].State === "READY") {
            await this.handleReadyState(resp![1]);
            if (this.currentBlockIndex < this.blockCount) {
              setTimeout(pollResults, 500);
            }
          } else {
            await this.updateExamProgress(resp![1]);
            setTimeout(pollResults, 500);
          }
        } else {
          this.logger.debug(
            "In memr-exam.component.ts runExamSubmissions, unknown result: " + resp![1]
          );
          await this.finishExam();
        }
      } catch (error) {
        this.logger.error("Error running exam submissions: " + error);
        await this.finishExam();
      }
    };
    pollResults();
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