import { ChangeDetectorRef, Component, OnDestroy, OnInit} from "@angular/core";
import { Subscription } from "rxjs";
import { ScreenOrientation } from "@capacitor/screen-orientation";

import { StateInterface } from "../../../../models/state/state.interface";
import { ManualAudiometryInterface } from "./manual-audiometry.interface";
import { PageInterface } from "../../../../models/page/page.interface";
import { ResultsInterface } from "../../../../models/results/results.interface";
import { ProtocolModelInterface } from "../../../../models/protocol/protocol.interface";
import { ConnectedDevice } from "../../../../interfaces/connected-device.interface";
import { AudiometryResultsInterface, RetsplsInterface } from "../../../../interfaces/audiometry-results.interface"
import { TympanResponse } from "../../../../models/devices/devices.interface";

import { isManualAudiometryResponseArea } from "../../../../guards/type.guard";
import { DevicesService } from "../../../../controllers/devices.service";
import { ExamService } from "../../../../controllers/exam.service";
import { PageModel } from "../../../../models/page/page.service";
import { StateModel } from "../../../../models/state/state.service";
import { ProtocolModel } from "../../../../models/protocol/protocol-model.service";
import { ResultsModel } from "../../../../models/results/results-model.service";
import { DevicesModel } from "../../../../models/devices/devices-model.service";

import { DeviceUtil } from "../../../../utilities/device-utility";
import { Logger } from "../../../../utilities/logger.service";;
import { DialogType, LevelUnits, ResultType } from "../../../../utilities/constants";
import { Notifications } from "../../../../utilities/notifications.service";
import { manualAudiometrySchema } from "../../../../../schema/response-areas/manual-audiometry.schema";

@Component({
    selector: 'manual-audiometry-view',
    templateUrl: './manual-audiometry.html',
    styleUrl: './manual-audiometry.css'
})

export class ManualAudiometryComponent implements OnInit, OnDestroy {
    // Configuration Variables
    retspls?: RetsplsInterface;
    levelUnits: string = manualAudiometrySchema.properties.levelUnits.default;
    frequencies: number[] = manualAudiometrySchema.properties.frequencies.default;
    adjustments: number[] = [5,-5];
    adjustmentStepSize: 2|3|4|5 = manualAudiometrySchema.properties.adjustmentStepSize.default;
    maxOutputLevel: number = manualAudiometrySchema.properties.maxOutputLevel.default;
    minOutputLevel: number = manualAudiometrySchema.properties.minOutputLevel.default;

    // Core Data
    results: ResultsInterface;
    protocol: ProtocolModelInterface;
    state: StateInterface;
    audiogramData: AudiometryResultsInterface = {
        frequencies: [],
        thresholds: [],
        channels: [],
        resultTypes: [],
        masking: [],
        levelUnits: this.levelUnits
    };

    // Controller Variables
    currentStep: string = 'Exam';
    selectedEar: "Left" | "Right" = "Left";
    currentDb: number = manualAudiometrySchema.properties.targetLevelInLevelUnits.default;
    currentDbSpl: number = manualAudiometrySchema.properties.targetLevelInLevelUnits.default;
    maskingLevel: number = -20;
    isPlaying: boolean = false;
    refreshGraph: boolean = true; 
    selectedFrequency: number = this.frequencies[1];

    // Subscriptions
    pageSubscription: Subscription|undefined;
    deviceSubscription: Subscription|undefined;
    device: ConnectedDevice|undefined;

    constructor(
        readonly examService: ExamService, 
        private readonly cdr: ChangeDetectorRef,
        private readonly resultsModel: ResultsModel, 
        private readonly pageModel: PageModel, 
        private readonly protocolModel: ProtocolModel, 
        private readonly stateModel: StateModel,
        private readonly devicesService: DevicesService,
        private readonly devicesModel: DevicesModel,
        private readonly deviceUtil: DeviceUtil,
        private readonly logger: Logger,
        private readonly notifications: Notifications,
    ) {
        this.results = this.resultsModel.getResults();
        this.protocol = this.protocolModel.getProtocolModel();
        this.state = this.stateModel.getState();
        
    }

    async ngOnInit() {
        this.pageSubscription = this.pageModel.currentPageSubject.subscribe(this.handlePageUpdate.bind(this));
        this.deviceSubscription = this.devicesModel.tympanResponseSubject.subscribe(this.logDeviceResponse.bind(this));
        try {
            await ScreenOrientation.lock({ orientation: "landscape" });
          } catch (error) {
            this.logger.error("Failed to lock screen orientation:" + error);
        }
    }

    async ngOnDestroy() {
        if (this.device) {
            this.devicesService.abortExams(this.device);
        }
        this.pageSubscription?.unsubscribe();
        this.deviceSubscription?.unsubscribe();
        try {
            await ScreenOrientation.unlock();
          } catch (error) {
            this.logger.error("Failed to unlock screen orientation:" + error);
          }
    }

    // ======= Audiometry Controls =======    
    async selectEar(ear: "Left" | "Right"): Promise<void> {
        this.selectedEar = ear;
    }
    
    async adjustTone(amount: number): Promise<void> {
        this.currentDbSpl = Math.max( this.minOutputLevel, Math.min(this.currentDbSpl + amount, this.maxOutputLevel));
        this.updateCurrentDb();
    }

    async adjustFrequency(direction: number): Promise<void> {
        const currentIndex = this.frequencies.indexOf(this.selectedFrequency);    
        if (direction > 0) {
            this.selectedFrequency = this.frequencies[(currentIndex + 1) % this.frequencies.length];
        } else {
            this.selectedFrequency = this.frequencies[
                (currentIndex - 1 + this.frequencies.length) % this.frequencies.length
            ];
        }
    }
    
    async adjustMasking(amount: number): Promise<void> {
        if (!this.maskingLevel) this.maskingLevel = 0;
        this.maskingLevel += amount;
        if (this.maskingLevel > 50) this.maskingLevel = 50;
        if (this.maskingLevel < -50) this.maskingLevel = -50;
        await this.submitAudiometryExam()
    }
    async playTone() {
        this.isPlaying = true;
        const playButton = document.querySelector('.play-btn') as HTMLElement;
        if (playButton) {
            playButton.classList.add('button-pressed');
        }
        
        await this.submitAudiometryExam();
        
        setTimeout(() => {
            this.isPlaying = false;
            if (playButton) {
                playButton.classList.remove('button-pressed');
            }
        }, 1000);
    }

    noResponse(): void {
        this.updateThreshold(this.selectedEar, this.selectedFrequency, this.currentDbSpl, ResultType.Beyond);
    }

    recordThreshold(): void {
        const resultType =
          this.currentDbSpl <= (this.minOutputLevel+this.adjustmentStepSize) ? ResultType.Better : ResultType.Threshold;
        this.updateThreshold(this.selectedEar, this.selectedFrequency, this.currentDb, resultType);
    }

    deleteThreshold(): void {
        this.updateThreshold(this.selectedEar, this.selectedFrequency, null);
    }

    submitResults(): void {
        this.audiogramData = {
          frequencies: [...this.audiogramData.frequencies],
          thresholds: [...this.audiogramData.thresholds],
          channels: [...this.audiogramData.channels],
          resultTypes: [...this.audiogramData.resultTypes],
          masking: [...this.audiogramData.masking],
          levelUnits: this.levelUnits,
        };
        this.currentStep = 'Results';
        this.cdr.detectChanges();
        this.examService.submit = this.examService.submitDefault.bind(this.examService);
        this.results.currentPage.response = this.audiogramData;
    }

    // ========== UI getters ====================
    get isNoResponseEnabled(): boolean {
        return this.currentDbSpl >= (this.maxOutputLevel-this.adjustmentStepSize);
      }
    
    getEarData(ear: "Left" | "Right"): AudiometryResultsInterface {
        const channel = ear === "Left" ? "left" : "right";
        return {
          frequencies: this.audiogramData.frequencies.filter(
            (_, i) => this.audiogramData.channels[i] === channel
          ),
          thresholds: this.audiogramData.thresholds.filter(
            (_, i) => this.audiogramData.channels[i] === channel
          ),
          channels: this.audiogramData.channels.filter(c => c === channel),
          resultTypes: this.audiogramData.resultTypes.filter(
            (_, i) => this.audiogramData.channels[i] === channel
          ),
          masking: this.audiogramData.masking.filter(
            (_, i) => this.audiogramData.channels[i] === channel
          ),
          levelUnits: this.audiogramData.levelUnits,
        };
      }
      
    // ======= Private Utility Functions =======    
    private logDeviceResponse(msg: TympanResponse) {
        this.logger.debug("device msg:" + JSON.stringify(msg));
    }

    private updateCurrentDb() {
        const tempDb = 
            this.retspls && this.levelUnits === LevelUnits.dB_HL
                ? this.currentDbSpl - this.getRetsplAtFrequency(this.selectedFrequency)
                : this.currentDbSpl;

        const steps = tempDb / this.adjustmentStepSize;
        // Round closest to 0
        // For positive numbers: floor (round down)
        // For negative numbers: ceiling (round up)
        const roundedSteps = tempDb >= 0 
            ? Math.floor(steps) 
            : Math.ceil(steps);
        const snappedDb = roundedSteps * this.adjustmentStepSize;
        const adjustment = snappedDb - tempDb;
        this.currentDb = snappedDb;
        this.currentDbSpl += adjustment;
    }

    private getRetsplAtFrequency(frequency: number): number {
        const frequencyStr = frequency.toString();
        return this.retspls![frequencyStr];
    }
    
    private updateThreshold(
        ear: "Left" | "Right",
        frequency: number,
        threshold: number | null,
        resultType: ResultType = ResultType.Threshold
    ) {
        const channel = ear === "Left" ? "left" : "right";
      
        const index = this.audiogramData.frequencies.findIndex(
          (f, i) => f === frequency && this.audiogramData.channels[i] === channel
        );
      
        if (index >= 0) {
          this.audiogramData.thresholds[index] = threshold;
          this.audiogramData.resultTypes[index] = resultType;
        } else {
            // Find the insertion point to maintain ascending frequency order
            // First, get all indices for the current channel
            const channelIndices = this.audiogramData.channels
              .map((c, i) => c === channel ? i : -1)
              .filter(i => i !== -1);
            
            // Find the appropriate insertion index
            let insertionIndex = this.audiogramData.frequencies.length; // Default to end
            
            for (const idx of channelIndices) {
              if (this.audiogramData.frequencies[idx] > frequency) {
                // Found a frequency that's higher than the current one
                insertionIndex = idx;
                break;
              }
            }
            
            // Insert the new data at the found position
            this.audiogramData.frequencies.splice(insertionIndex, 0, frequency);
            this.audiogramData.channels.splice(insertionIndex, 0, channel);
            this.audiogramData.thresholds.splice(insertionIndex, 0, threshold);
            this.audiogramData.resultTypes.splice(insertionIndex, 0, resultType);
            this.audiogramData.masking.splice(insertionIndex, 0, false); // Default masking
        }

        this.refreshGraph = false;
        setTimeout(() => {
            this.refreshGraph = true;
        }, 0);
    }

    private async submitAudiometryExam() {
        let examProperties = {
            "F": this.selectedFrequency,
            "Level": this.currentDbSpl,
            "OutputChannel": this.selectedEar==="Left" ? "HPL0" : "HPR0",
            // "PlayStimulus": this.isPlaying, --> only needed with masking
            // "MaskerLevel": this.maskingLevel
        };
        let resp = await this.devicesService.examSubmission(this.device!, examProperties);
        this.logger.debug("resp from tympan after manual audiometry exam submission:" + resp);
    }

    private async handlePageUpdate(updatedPage: PageInterface) {
        if (isManualAudiometryResponseArea(updatedPage)) {
            const updatedAudiometryResponseArea = updatedPage.responseArea as ManualAudiometryInterface;
            this.setupAudiometry(updatedAudiometryResponseArea);
            this.setupDevice(updatedAudiometryResponseArea);
        }
    }
         
    private setupAudiometry(updatedAudiometryResponseArea: ManualAudiometryInterface) {
        this.maxOutputLevel = updatedAudiometryResponseArea.maxOutputLevel ?? this.maxOutputLevel;
        this.minOutputLevel = updatedAudiometryResponseArea.minOutputLevel ?? this.minOutputLevel;
        this.levelUnits = updatedAudiometryResponseArea.levelUnits ?? this.levelUnits;
        this.frequencies = updatedAudiometryResponseArea.frequencies ?? this.frequencies;
        this.adjustmentStepSize = updatedAudiometryResponseArea.adjustmentStepSize ?? this.adjustmentStepSize;
        this.adjustments = [
            (updatedAudiometryResponseArea.adjustmentStepSize??this.adjustmentStepSize) * 
                (updatedAudiometryResponseArea.incrementRatioMultiplier??manualAudiometrySchema.properties.incrementRatioMultiplier.default),
            -(updatedAudiometryResponseArea.adjustmentStepSize??this.adjustmentStepSize)
        ];
        this.selectedFrequency = this.frequencies[1];
        this.retspls = updatedAudiometryResponseArea.retspls;
        this.currentDbSpl = this.levelUnits === LevelUnits.dB_SPL
            ? updatedAudiometryResponseArea.targetLevelInLevelUnits ?? manualAudiometrySchema.properties.targetLevelInLevelUnits.default
            :  (updatedAudiometryResponseArea.targetLevelInLevelUnits ?? manualAudiometrySchema.properties.targetLevelInLevelUnits.default) + this.getRetsplAtFrequency(this.selectedFrequency);
        this.updateCurrentDb();

        if (this.retspls && this.levelUnits === LevelUnits.dB_HL) {
            this.verifyEachFrequencyHasRetspl();
        }

        if (updatedAudiometryResponseArea.showResults ?? manualAudiometrySchema.properties.showResults.default) {
            this.examService.submit = this.submitResults.bind(this);
        }
    }

    private async setupDevice(updatedAudiometryResponseArea: ManualAudiometryInterface) {
        this.device = this.deviceUtil.getDeviceFromTabsintId(updatedAudiometryResponseArea.tabsintId ?? "1");
        if (this.device) {
            const examProperties = {};
            await this.devicesService.queueExam(this.device, "ManualAudiometry", examProperties);
        } else {
            this.logger.error("Error setting up Manual Audiometry exam");
        }
    }
 
    private verifyEachFrequencyHasRetspl(){
        const missingFrequencies = this.frequencies
            .map(String)
            .filter(frequency => !(frequency in this.retspls!));
        if (missingFrequencies.length) {
            this.logger.error(`Missing frequencies in retspls: ${missingFrequencies.join(', ')}`);
            this.notifications
                .alert({
                    title: "Alert",
                    content: `The RETSPLs provided in the protocol do not specify all the frequencies. Missing frequencies: ${missingFrequencies.join(', ')}. The exam may proceed unexpectedly.`,
                    type: DialogType.Alert,
                })
                .subscribe();
            this.retspls = undefined;
        }
    }
}