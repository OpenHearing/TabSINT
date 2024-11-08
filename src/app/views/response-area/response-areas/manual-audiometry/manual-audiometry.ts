import { Component, OnDestroy, OnInit } from "@angular/core";
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
import { DeviceResponse } from "../../../../models/devices/devices.interface";
import { DevicesService } from "../../../../controllers/devices.service";
import { ConnectedDevice } from "../../../../interfaces/connected-device.interface";
import { DeviceUtil } from "../../../../utilities/device-utility";
import { Logger } from "../../../../utilities/logger.service";
import { ExamService } from "../../../../controllers/exam.service";
import { AudiogramDataStructInterface } from "../../../../interfaces/audiogram.interface";
import { isManualAudiometryResponseArea } from "../../../../guards/type.guard";

@Component({
    selector: 'manual-audiometry-view',
    templateUrl: './manual-audiometry.html',
    styleUrl: './manual-audiometry.css'
  })

export class ManualAudiometryComponent implements OnInit, OnDestroy {
    results: ResultsInterface;
    protocol: ProtocolModelInterface;
    state: StateInterface;
    isPresentationVisible: boolean = false;
    isResultsVisible: boolean = false;
    currentDbSpl: number = 40;
    frequencies: number[] = [1, 2, 4];
    adjustments: number[] = [5, -10];
    maxOutputLevel: number = 100;
    minOutputLevel: number = -20;
    selectedEar: string = 'Left';
    leftThresholds: (number|null)[] = [null, null, null];
    rightThresholds: (number|null)[] = [null, null, null];
    leftCurrentColumn: number = 0;
    rightCurrentColumn: number = 0;
    pageSubscription: Subscription|undefined;
    deviceSubscription: Subscription|undefined;
    initialDbSpl: number = 40;
    currentFrequencyIndex: number = 0;
    selectedFrequency: number = this.frequencies[0];
    device: ConnectedDevice|undefined;
    currentStep: string = 'Exam';
    audiogramData: AudiogramDataStructInterface = {
        frequencies: [1000],
        thresholds: [null],
        channels: [''],
        resultTypes: [''],
        masking: [false]
    };

    constructor(
        private readonly resultsModel: ResultsModel, 
        private readonly pageModel: PageModel, 
        private readonly protocolModel: ProtocolModel, 
        private readonly stateModel: StateModel,
        private readonly devicesService: DevicesService,
        private readonly devicesModel: DevicesModel,
        private readonly deviceUtil: DeviceUtil,
        private readonly examService: ExamService, 
        private readonly logger: Logger
    ) {
        this.results = this.resultsModel.getResults();
        this.protocol = this.protocolModel.getProtocolModel();
        this.state = this.stateModel.getState();
        
    }

    ngOnInit() {
        this.pageSubscription = this.pageModel.currentPageSubject.subscribe(this.handlePageUpdate.bind(this));
        this.deviceSubscription = this.devicesModel.deviceResponseSubject.subscribe(this.logDeviceResponse.bind(this));
    }

    ngOnDestroy() {
        if (this.device) {
            this.devicesService.abortExams(this.device);
        }
        this.pageSubscription?.unsubscribe();
        this.deviceSubscription?.unsubscribe();
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

    adjustDbSpl(amount: number) {
        this.currentDbSpl += amount;
        if (this.currentDbSpl < this.minOutputLevel) {
            this.currentDbSpl = this.minOutputLevel;
        } else if (this.currentDbSpl > this.maxOutputLevel) {
            this.currentDbSpl = this.maxOutputLevel;
        }
    }

    playTone() {
        let examProperties = {
            "F": this.selectedFrequency,
            "Level": this.currentDbSpl,
            "OutputChannel": this.selectedEar==="Left" ? "HPL0" : "HPR0"
        };
        if (this.device) {
            this.devicesService.examSubmission(this.device, examProperties);
        }
    }

    recordThreshold() {
        if (this.selectedEar === 'Left') {
            this.leftThresholds[this.currentFrequencyIndex] = this.currentDbSpl;
        } else if (this.selectedEar === 'Right') {
            this.rightThresholds[this.currentFrequencyIndex] = this.currentDbSpl;
        }
        this.currentFrequencyIndex = (this.currentFrequencyIndex + 1) % this.frequencies.length;
        this.selectedFrequency = this.frequencies[this.currentFrequencyIndex];
        this.currentDbSpl = this.initialDbSpl;
        this.results.currentPage.response = {
            rightThresholds: this.rightThresholds,
            leftThresholds: this.leftThresholds
        }
    }

    submitResults(): void {

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
        };
        
        this.currentStep = 'Results';
        this.examService.submit = this.examService.submitDefault.bind(this.examService);
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
        this.currentDbSpl = updatedAudiometryResponseArea.currentDbSpl ?? 40;
        this.initialDbSpl = this.currentDbSpl;
        this.frequencies = updatedAudiometryResponseArea.frequencies ?? [1, 2, 4];
        this.adjustments = updatedAudiometryResponseArea.adjustments ?? [5, -10];
        this.leftThresholds = new Array(this.frequencies.length).fill(null);
        this.rightThresholds = new Array(this.frequencies.length).fill(null);
        this.selectedFrequency = this.frequencies[0];

        if (updatedAudiometryResponseArea.showResults) {
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
    
    private logDeviceResponse(msg: DeviceResponse) {
        console.log("device msg:", JSON.stringify(msg));
    }
}