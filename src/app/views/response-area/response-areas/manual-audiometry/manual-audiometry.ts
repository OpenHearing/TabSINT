import { Component, OnDestroy, OnInit, HostListener } from "@angular/core";
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
import { DialogType, LevelUnits } from "../../../../utilities/constants";
import { Notifications } from "../../../../utilities/notifications.service";
import { TympanResponse } from "../../../../models/devices/devices.interface";
import { ScreenOrientation } from "@capacitor/screen-orientation";

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
        resultTypes: ['Threshold', 'Threshold', 'Threshold', 'Threshold', 'Threshold'], // Type of results
        masking: [false, false, false, false, false], // Masking values (set as false by default)
        levelUnits: LevelUnits.dB_SPL // Specify the units (e.g., dB SPL or dB HL)
      };

    audiogramDataRight: AudiometryResultsInterface = {
        frequencies: [500, 1000, 2000, 4000, 8000], 
        thresholds: [null, null, null, null, null],
        channels: ['right', 'right', 'right', 'right', 'right'], 
        resultTypes: ['Threshold', 'Threshold', 'Threshold', 'Threshold', 'Threshold'],
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
            console.log("Screen locked to landscape.");
          } catch (error) {
            console.error("Failed to lock screen orientation:", error);
        }
    }

    async ngOnDestroy() {
        if (this.device) {
            this.devicesService.abortExams(this.device);
        }
        this.pageSubscription?.unsubscribe();
        try {
            await ScreenOrientation.unlock();
            console.log("Screen orientation unlocked.");
          } catch (error) {
            console.error("Failed to unlock screen orientation:", error);
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
            this.audiogramDataLeft.resultTypes[index] = 'Threshold'; 
          }
        } else if (this.selectedEar === 'Right') {
          const index = this.audiogramDataRight.frequencies.indexOf(currentFrequency);
          if (index !== -1) {
            this.audiogramDataRight.thresholds[index] = null;
            this.audiogramDataRight.resultTypes[index] = 'Threshold'; 
          }
        }
        this.refreshGraph = false;
        setTimeout(() => (this.refreshGraph = true), 0);
      }

    noResponse(): void {
        const currentFrequency = this.selectedFrequency;
        const currentThreshold = this.currentDbSpl;
        if (this.selectedEar === 'Left') {
          const index = this.audiogramDataLeft.frequencies.indexOf(currentFrequency);
          if (index !== -1) {
            // Mark this threshold as "No Response" for Left ear
            this.audiogramDataLeft.thresholds[index] = currentThreshold; // 120 dB as convention
            this.audiogramDataLeft.resultTypes[index] = 'NoResponseLeft';
          }
        } else if (this.selectedEar === 'Right') {
          const index = this.audiogramDataRight.frequencies.indexOf(currentFrequency);
          if (index !== -1) {
            // Mark this threshold as "No Response" for Right ear
            this.audiogramDataRight.thresholds[index] = currentThreshold;
            this.audiogramDataRight.resultTypes[index] = 'NoResponseRight';
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
        console.log("resp from tympan after manual audiometry exam submission:",resp);
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

    // recordThreshold() {
    //     if (this.selectedEar === 'Left') {
    //         this.leftThresholds[this.currentFrequencyIndex] = this.currentDb;
    //     } else if (this.selectedEar === 'Right') {
    //         this.rightThresholds[this.currentFrequencyIndex] = this.currentDb;
    //     }
    //     this.currentFrequencyIndex = (this.currentFrequencyIndex + 1) % this.frequencies.length;
    //     this.selectedFrequency = this.frequencies[this.currentFrequencyIndex];
    //     this.currentDb = this.initialDb;
    //     this.setCurrentDbSpl();
    //     this.results.currentPage.response = this.organizeAudiometryResults();
    // }

    submitResults(): void {
        // this.audiogramData = this.organizeAudiometryResults();
        // this.currentStep = 'Results';
        // this.examService.submit = this.examService.submitDefault.bind(this.examService);
        const combinedResults: AudiometryResultsInterface = {
            frequencies: [...this.audiogramDataLeft.frequencies, ...this.audiogramDataRight.frequencies],
            thresholds: [...this.audiogramDataLeft.thresholds, ...this.audiogramDataRight.thresholds],
            channels: [...this.audiogramDataLeft.channels, ...this.audiogramDataRight.channels],
            resultTypes: [...this.audiogramDataLeft.resultTypes, ...this.audiogramDataRight.resultTypes],
            masking: [...this.audiogramDataLeft.masking, ...this.audiogramDataRight.masking],
            levelUnits: LevelUnits.dB_SPL
        };
    
        this.audiogramData = combinedResults;
        this.currentStep = 'Results';
        this.examService.submit = this.examService.submitDefault.bind(this.examService);
    }
        
    private organizeAudiometryResults() {
        const leftChannels = Array(this.leftThresholds.length).fill('left');
        const rightChannels = Array(this.rightThresholds.length).fill('right');
        const channels = leftChannels.concat(rightChannels);
        const masking = Array(channels.length).fill(false);
        const resultTypes = Array(channels.length).fill('Threshold');

        this.audiogramData =  {
            frequencies: this.frequencies.concat(this.frequencies),
            thresholds: this.leftThresholds.concat(this.rightThresholds),
            channels,
            resultTypes,
            masking,
            levelUnits: this.levelUnits
        };
    }

    private async handlePageUpdate(updatedPage: PageInterface) {
        if (isManualAudiometryResponseArea(updatedPage)) {
            const updatedAudiometryResponseArea = updatedPage.responseArea as ManualAudiometryInterface;
            this.initializeAudiometrySettings(updatedAudiometryResponseArea);
            this.setupDevice(updatedAudiometryResponseArea);
        }
    }

    private initializeAudiometrySettings(updatedAudiometryResponseArea: ManualAudiometryInterface) {
        this.maxOutputLevel = updatedAudiometryResponseArea.maxOutputLevel ?? 100;
        this.minOutputLevel = updatedAudiometryResponseArea.minOutputLevel ?? 0;
        this.currentDb = updatedAudiometryResponseArea.targetLevel ?? 40;
        this.levelUnits = updatedAudiometryResponseArea.levelUnits ?? LevelUnits.dB_SPL;
        this.initialDb = this.currentDb;
        this.frequencies = updatedAudiometryResponseArea.frequencies ?? [1, 2, 4];
        this.adjustments = updatedAudiometryResponseArea.adjustments?.length === 2
        ? updatedAudiometryResponseArea.adjustments
        : [5, -5];
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

        if (updatedAudiometryResponseArea.showResults ?? true) {
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
        console.log("device msg:", JSON.stringify(msg));
    }
}