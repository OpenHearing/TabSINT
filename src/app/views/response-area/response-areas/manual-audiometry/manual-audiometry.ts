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
import { DevicesService } from "../../../../controllers/devices.service";
import { ConnectedDevice } from "../../../../interfaces/connected-device.interface";
import { DeviceUtil } from "../../../../utilities/device-utility";
import { Logger } from "../../../../utilities/logger.service";

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
    initialDbSpl: number = 40;
    currentFrequencyIndex: number = 0;
    selectedFrequency: number = this.frequencies[0];
    device: ConnectedDevice|undefined;

    constructor(
        private readonly resultsModel: ResultsModel, 
        private readonly pageModel: PageModel, 
        private readonly protocolModel: ProtocolModel, 
        private readonly stateModel: StateModel,
        private readonly devicesService: DevicesService,
        private readonly devicesModel: DevicesModel,
        private readonly deviceUtil: DeviceUtil,
        private readonly logger: Logger
    ) {
        this.results = this.resultsModel.getResults();
        this.protocol = this.protocolModel.getProtocolModel();
        this.state = this.stateModel.getState();
    }

    ngOnInit() {
        this.pageSubscription = this.pageModel.currentPageSubject.subscribe(async (updatedPage: PageInterface) => {
            if (updatedPage?.responseArea?.type === "manualAudiometryResponseArea") {
                const updatedAudiometryResponseArea = updatedPage?.responseArea as ManualAudiometryInterface;

                if (updatedAudiometryResponseArea) {
                    this.maxOutputLevel = updatedAudiometryResponseArea.maxOutputLevel ?? 100;
                    this.minOutputLevel = updatedAudiometryResponseArea.minOutputLevel ?? 0;
                    this.currentDbSpl = updatedAudiometryResponseArea.currentDbSpl ?? 40;
                    this.initialDbSpl = this.currentDbSpl; 
                    this.frequencies = updatedAudiometryResponseArea.frequencies ?? [1, 2, 4];
                    this.adjustments = updatedAudiometryResponseArea.adjustments ?? [5, -10];
                    this.leftThresholds = new Array(this.frequencies.length).fill(null);
                    this.rightThresholds = new Array(this.frequencies.length).fill(null);
                    this.selectedFrequency = this.frequencies[0];

                    this.device = this.deviceUtil.getDeviceFromTabsintId(updatedAudiometryResponseArea.tabsintId ?? "1");
                    if (this.device) {
                        let examProperties = {};
                        let resp = await this.devicesService.queueExam(this.device, "ManualAudiometry", examProperties);
                        console.log("resp from tympan after manual audiometry queue exam:",resp);
                    } else {
                        this.logger.error("Error setting up Manual Audiometry exam");
                    }
                }
            }
        });
    }
    
    async ngOnDestroy() {
        if (this.device) {
            let resp = await this.devicesService.abortExams(this.device);
            console.log("resp from tympan after manual audiometry abort exams:",resp);
        }
        this.pageSubscription?.unsubscribe();
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

    async playTone() {
        let examProperties = {
            "F": this.selectedFrequency,
            "Level": this.currentDbSpl,
            "OutputChannel": this.selectedEar==="Left" ? "HPL0" : "HPR0"
        };
        if (this.device) {
            let resp = await this.devicesService.examSubmission(this.device, examProperties);
            console.log("resp from tympan after manual audiometry exam submission:",resp);
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
}