import { Component, OnDestroy, OnInit} from "@angular/core";
import { PageModel } from "../../../../models/page/page.service";
import { StateModel } from "../../../../models/state/state.service";
import { ProtocolModel } from "../../../../models/protocol/protocol-model.service";
import { ResultsModel } from "../../../../models/results/results-model.service";
import { PageInterface } from "../../../../models/page/page.interface";
import { ResultsInterface } from "../../../../models/results/results.interface";
import { ProtocolModelInterface } from "../../../../models/protocol/protocol.interface";
import { StateInterface } from "../../../../models/state/state.interface";
import { Subscription } from "rxjs";
import { ManualAudiometryInterface } from "./manual-audiometry.interface";
import { DevicesModel } from "../../../../models/devices/devices-model.service";
import { DevicesService } from "../../../../controllers/devices.service";
import { ConnectedDevice } from "../../../../interfaces/connected-device.interface";
import { DeviceUtil } from "../../../../utilities/device-utility";
import { Logger } from "../../../../utilities/logger.service";
import { ExamService } from "../../../../controllers/exam.service";
import { AudiometryResultsInterface, RetsplsInterface } from "../../../../interfaces/audiometry-results.interface";
import { isManualAudiometryResponseArea } from "../../../../guards/type.guard";
import { DialogType, LevelUnits, ResultType } from "../../../../utilities/constants";
import { Notifications } from "../../../../utilities/notifications.service";
import { TympanResponse } from "../../../../models/devices/devices.interface";
import { ScreenOrientation } from "@capacitor/screen-orientation";
import { manualAudiometrySchema } from "../../../../../schema/response-areas/manual-audiometry.schema";

@Component({
    selector: 'manual-audiometry-view',
    templateUrl: './manual-audiometry.html',
    styleUrl: './manual-audiometry.css'
})

export class ManualAudiometryComponent implements OnInit, OnDestroy {
    audiogramDataLeft: AudiometryResultsInterface = {
        frequencies: [500, 1000, 2000, 4000, 8000], // Define all the frequencies you need
        thresholds: [null, null, null, null, null], // Threshold values for each frequency (null initially)
        channels: ['left', 'left', 'left', 'left', 'left'], // All "left" for the left ear
        resultTypes: [
            ResultType.Threshold,
            ResultType.Threshold,
            ResultType.Threshold,
            ResultType.Threshold,
            ResultType.Threshold
        ],
        masking: [false, false, false, false, false], // Masking values (set as false by default)
        levelUnits: LevelUnits.dB_SPL // Specify the units (e.g., dB SPL or dB HL)
      };

    audiogramDataRight: AudiometryResultsInterface = {
        frequencies: [500, 1000, 2000, 4000, 8000], 
        thresholds: [null, null, null, null, null],
        channels: ['right', 'right', 'right', 'right', 'right'], 
        resultTypes: [
            ResultType.Threshold,
            ResultType.Threshold,
            ResultType.Threshold,
            ResultType.Threshold,
            ResultType.Threshold
        ],
        masking: [false, false, false, false, false], 
        levelUnits: LevelUnits.dB_SPL 
      };
    selectedEar: string = 'Left'; 
    results: ResultsInterface;
    protocol: ProtocolModelInterface;
    state: StateInterface;
    isPresentationVisible: boolean = false;
    isResultsVisible: boolean = false;
    currentDbSpl: number = 40;
    currentDb: number = 40;
    frequencies: number[] = [1, 2, 4];
    adjustments: number[] = [5, -5];
    maxOutputLevel: number = 100;
    minOutputLevel: number = -20;
    leftThresholds: (number|null)[] = [null, null, null];
    rightThresholds: (number|null)[] = [null, null, null];
    leftCurrentColumn: number = 0;
    rightCurrentColumn: number = 0;
    pageSubscription: Subscription|undefined;
    deviceSubscription: Subscription|undefined;
    initialDb: number = 40;
    currentFrequencyIndex: number = 0;
    selectedFrequency: number = this.frequencies[0];
    device: ConnectedDevice|undefined;
    currentStep: string = 'Exam';
    audiogramData: AudiometryResultsInterface = {
        frequencies: [1000],
        thresholds: [null],
        channels: [''],
        resultTypes: [''],
        masking: [false],
        levelUnits: LevelUnits.dB_SPL
    };
    retspls?: RetsplsInterface;
    levelUnits: string= LevelUnits.dB_SPL;
    frequencyStep: number = 250;
    currentFrequency: number = 1000;
    maskingLevel: number = -20;
    isPlaying: boolean = false;
    refreshGraph = true; 
    constructor(
        private readonly resultsModel: ResultsModel, 
        private readonly pageModel: PageModel, 
        private readonly protocolModel: ProtocolModel, 
        private readonly stateModel: StateModel,
        private readonly devicesService: DevicesService,
        private readonly devicesModel: DevicesModel,
        private readonly deviceUtil: DeviceUtil,
        private readonly examService: ExamService, 
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
        try {
            await ScreenOrientation.unlock();
          } catch (error) {
            this.logger.error("Failed to unlock screen orientation:" + error);
          }
    }

    onFrequencyChange(selectedFreq: number): void {
        selectedFreq = Number(selectedFreq);
        this.currentFrequencyIndex = this.frequencies.indexOf(selectedFreq);
        this.selectedFrequency = this.frequencies[this.currentFrequencyIndex];
    }

    toggleSection(section: string): void {
        if (section === 'presentation') {
            this.isPresentationVisible = !this.isPresentationVisible;
        } else if (section === 'results') {
            this.isResultsVisible = !this.isResultsVisible;
        }
    }



    async adjustTone(amount: number): Promise<void> {
        this.currentDbSpl += amount;
        if (this.currentDbSpl < this.minOutputLevel) {
            this.currentDbSpl = this.minOutputLevel;
        } else if (this.currentDbSpl > this.maxOutputLevel) {
            this.currentDbSpl = this.maxOutputLevel;
        }
        this.setCurrentDb();
        await this.submitAudiometryExam();

    }

    get isNoResponseEnabled(): boolean {
        return this.currentDbSpl >= this.maxOutputLevel || this.currentDbSpl <= this.minOutputLevel;
      }
    
    recordThreshold(): void {
    const currentThreshold = this.currentDbSpl;
    const currentFrequency = this.selectedFrequency;
    this.clearPoint();
    if (this.selectedEar === 'Left') {
        const index = this.audiogramDataLeft.frequencies.indexOf(currentFrequency);
        if (index !== -1) {
        this.audiogramDataLeft.thresholds[index] = currentThreshold;
        }
    } else if (this.selectedEar === 'Right') {
        const index = this.audiogramDataRight.frequencies.indexOf(currentFrequency);
        if (index !== -1) {
        this.audiogramDataRight.thresholds[index] = currentThreshold;
        }
    }
    this.refreshGraph = false;
    setTimeout(() => (this.refreshGraph = true), 0);
    }

    clearPoint(): void {
        const currentFrequency = this.selectedFrequency;
      
        if (this.selectedEar === 'Left') {
          const index = this.audiogramDataLeft.frequencies.indexOf(currentFrequency);
          if (index !== -1) {
            this.audiogramDataLeft.thresholds[index] = null;
            this.audiogramDataLeft.resultTypes[index] = ResultType.Threshold;  
          }
        } else if (this.selectedEar === 'Right') {
          const index = this.audiogramDataRight.frequencies.indexOf(currentFrequency);
          if (index !== -1) {
            this.audiogramDataRight.thresholds[index] = null;
            this.audiogramDataRight.resultTypes[index] = ResultType.Threshold;
          }
        }
        this.refreshGraph = false;
        setTimeout(() => (this.refreshGraph = true), 0);
      }

      noResponse(): void {
        const currentFrequency = this.selectedFrequency;
        const currentThreshold = this.currentDbSpl;
        let resultType: ResultType;
    
        if (currentThreshold >= this.maxOutputLevel) {
            resultType = ResultType.Beyond;
        } else {
            resultType = ResultType.Better;
        }
        if (this.selectedEar === 'Left') {
            const index = this.audiogramDataLeft.frequencies.indexOf(currentFrequency);
            if (index !== -1) {
                this.audiogramDataLeft.thresholds[index] = currentThreshold;
                this.audiogramDataLeft.resultTypes[index] = resultType;
            }
        } else if (this.selectedEar === 'Right') {
            const index = this.audiogramDataRight.frequencies.indexOf(currentFrequency);
            if (index !== -1) {
                this.audiogramDataRight.thresholds[index] = currentThreshold;
                this.audiogramDataRight.resultTypes[index] = resultType;
            }
        }
    
        // Refresh the graph
        this.refreshGraph = false;
        setTimeout(() => (this.refreshGraph = true), 0);
    }
    
    async selectEar(ear: string): Promise<void> {
        this.selectedEar = ear;
        this.refreshGraph = false;
        setTimeout(() => (this.refreshGraph = true), 0); // Update the selected ear
        await this.submitAudiometryExam()
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

        await this.submitAudiometryExam()
    }
    
    
    adjustMasking(amount: number): void {
        if (!this.maskingLevel) this.maskingLevel = 0;
        this.maskingLevel += amount;
        if (this.maskingLevel > 50) this.maskingLevel = 50;
        if (this.maskingLevel < -50) this.maskingLevel = -50;
    }

    async playTone() {
        let examProperties = {
            "F": this.selectedFrequency,
            "Level": this.currentDbSpl,
            "OutputChannel": this.selectedEar==="Left" ? "HPL0" : "HPR0"
        };
        let resp = await this.devicesService.examSubmission(this.device!, examProperties);
        this.logger.debug("resp from tympan after manual audiometry exam submission:" + resp);
    }

    async togglePlayPause() {
        this.isPlaying = !this.isPlaying;
        await this.submitAudiometryExam()
    }

    async submitAudiometryExam() {
        if (this.isPlaying) {
            await this.playTone()
        }
    }

    submitResults(): void {
        const combinedResults: AudiometryResultsInterface = {
            frequencies: [...this.audiogramDataLeft.frequencies, ...this.audiogramDataRight.frequencies],
            thresholds: [...this.audiogramDataLeft.thresholds, ...this.audiogramDataRight.thresholds],
            channels: [...this.audiogramDataLeft.channels, ...this.audiogramDataRight.channels],
            resultTypes: [...this.audiogramDataLeft.resultTypes, ...this.audiogramDataRight.resultTypes],
            masking: [...this.audiogramDataLeft.masking, ...this.audiogramDataRight.masking],
            levelUnits: this.levelUnits
        };
    
        this.audiogramData = combinedResults;
        this.currentStep = 'Results';
        this.examService.submit = this.examService.submitDefault.bind(this.examService);
        this.results.currentPage.response = combinedResults;
    }
        

    private async handlePageUpdate(updatedPage: PageInterface) {
        if (isManualAudiometryResponseArea(updatedPage)) {
            const updatedAudiometryResponseArea = updatedPage.responseArea as ManualAudiometryInterface;
            this.initializeAudiometrySettings(updatedAudiometryResponseArea);
            this.setupDevice(updatedAudiometryResponseArea);
        }
    }

    private initializeAudiometrySettings(updatedAudiometryResponseArea: ManualAudiometryInterface) {
        this.maxOutputLevel = updatedAudiometryResponseArea.maxOutputLevel ?? manualAudiometrySchema.properties.maxOutputLevel.default;
        this.minOutputLevel = updatedAudiometryResponseArea.minOutputLevel ?? manualAudiometrySchema.properties.minOutputLevel.default;
        this.currentDb = updatedAudiometryResponseArea.targetLevel ?? manualAudiometrySchema.properties.targetLevel.default;
        this.levelUnits = updatedAudiometryResponseArea.levelUnits ?? manualAudiometrySchema.properties.levelUnits.default;
        this.initialDb = this.currentDb;
        this.frequencies = updatedAudiometryResponseArea.frequencies ?? manualAudiometrySchema.properties.frequencies.default;
        this.adjustments = updatedAudiometryResponseArea.adjustments?.length === 2
            ? updatedAudiometryResponseArea.adjustments
            : manualAudiometrySchema.properties.adjustments.default;
        this.leftThresholds = new Array(this.frequencies.length).fill(null);
        this.rightThresholds = new Array(this.frequencies.length).fill(null);
        this.selectedFrequency = this.frequencies[0];
        this.retspls = updatedAudiometryResponseArea.retspls;
        this.audiogramDataLeft.levelUnits = this.levelUnits;
        this.audiogramDataRight.levelUnits = this.levelUnits;

        if (this.retspls && this.levelUnits === LevelUnits.dB_HL) {
            this.checkResplKeysAreInFrequencies();
            this.verifyEachFrequencyHasRetspl();
        }

        if (this.levelUnits === LevelUnits.dB_HL) {
            this.currentDbSpl = this.currentDb + this.getRetsplAtCurrentFrequency(this.selectedFrequency);
        }

        if (updatedAudiometryResponseArea.showResults ?? manualAudiometrySchema.properties.showResults.default) {
            this.examService.submit = this.submitResults.bind(this);
        }
    }

    private verifyEachFrequencyHasRetspl(){
        const missingFrequencies: string[] = [];
        
        for (const frequency of this.frequencies) {
            const frequencyStr = frequency.toString();
            if (!(frequencyStr in this.retspls!)) {
            missingFrequencies.push(frequencyStr);
            }
        }
        
        if (missingFrequencies.length > 0) {
            this.logger.error(`Missing frequencies in retspls: ${missingFrequencies.join(', ')}`);
            this.notifications.alert({
                title: "Alert",
                content: 
`The RETSPLs provided in the protocol does not specify all the frequencies specified 
in the protocol. The exam may proceed unexpectedly at the frequency(ies) missing RETSPLs.`,
                type: DialogType.Alert
            }
            ).subscribe();
            this.retspls = undefined;
        }           
    }

    private checkResplKeysAreInFrequencies() {
        const keys = Object.keys(this.retspls!);
        keys.forEach(key => {
            if (!this.frequencies.includes(Number(key))) {
                this.logger.error(`Unknown frequency in retspls. ${key} : ${this.retspls![key]}`);
                this.notifications.alert({
                    title: "Alert",
                    content: 
`The retspl ${this.retspls![key]} at frequency ${key} was provided in the protocol but is 
not recognized as a frequency requested for this exam, it will be ignored.` ,
                    type: DialogType.Alert
                }
                ).subscribe();

            }
        })        
    }

    private getRetsplAtCurrentFrequency(frequency: number): number {
        const frequencyStr = frequency.toString();
        return this.retspls![frequencyStr];
      }
      
    private setCurrentDb() {
    if (this.retspls && this.levelUnits === LevelUnits.dB_HL) {
        this.currentDb = this.currentDbSpl - this.getRetsplAtCurrentFrequency(this.selectedFrequency);
    } else {
        this.currentDb = this.currentDbSpl;
    }}

    private setCurrentDbSpl() {
        if (this.retspls && this.levelUnits === LevelUnits.dB_HL) {
            this.currentDbSpl = this.currentDb + this.getRetsplAtCurrentFrequency(this.selectedFrequency);
        } else {
            this.currentDbSpl = this.currentDb;
        }}
    
    private async setupDevice(updatedAudiometryResponseArea: ManualAudiometryInterface) {
        this.device = this.deviceUtil.getDeviceFromTabsintId(updatedAudiometryResponseArea.tabsintId ?? "1");
        if (this.device) {
            const examProperties = {};
            await this.devicesService.queueExam(this.device, "ManualAudiometry", examProperties);
        } else {
            this.logger.error("Error setting up Manual Audiometry exam");
        }
    }
    
    private logDeviceResponse(msg: TympanResponse) {
        this.logger.debug("device msg:" + JSON.stringify(msg));
    }
}