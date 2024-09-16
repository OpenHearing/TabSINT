import { Component } from "@angular/core";
import { PageModel } from "../../../../models/page/page.service";
import { StateModel } from "../../../../models/state/state.service";
import { ProtocolModel } from "../../../../models/protocol/protocol-model.service";
import { ResultsModel } from "../../../../models/results/results-model.service";
import { PageInterface } from "../../../../models/page/page.interface";
import { ResultsInterface } from "../../../../models/results/results.interface";
import { ProtocolModelInterface } from "../../../../models/protocol/protocol.interface";
import { StateInterface } from "../../../../models/state/state.interface";
import { Observable } from "rxjs/internal/Observable";
import { ManualAudiometryInterface } from "./manual-audiometry.interface";

@Component({
    selector: 'audiometry-view',
    templateUrl: './manual-audiometry.html',
    styleUrl: './manual-audiometry.css'
  })

export class ManualAudiometryComponent{
    currentPage: PageInterface;
    results: ResultsInterface;
    protocol: ProtocolModelInterface;
    state: StateInterface
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
    observableVar: Observable<PageInterface>;
    initialDbSpl: number = 40;
    currentFrequencyIndex: number = 0;
    selectedFrequency:number = this.frequencies[0]
    constructor(public resultsModel: ResultsModel, public pageModel: PageModel, public protocolModel: ProtocolModel, public stateModel: StateModel) {
        this.results = this.resultsModel.getResults();
        this.protocol = this.protocolModel.getProtocolModel();
        this.state = this.stateModel.getState();
        this.currentPage = this.pageModel.getPage();
        const audiometryResponse = this.currentPage.responseArea as ManualAudiometryInterface;

        if (audiometryResponse) {
            this.maxOutputLevel = audiometryResponse.maxOutputLevel ?? 100;
            this.minOutputLevel = audiometryResponse.minOutputLevel ?? 0;
            this.currentDbSpl = audiometryResponse.currentDbSpl ?? 40;
            this.initialDbSpl = this.currentDbSpl;
            this.frequencies = audiometryResponse.frequencies ?? [1, 2, 4];
            this.adjustments = audiometryResponse.adjustments ?? [5, -10];
            this.leftThresholds = new Array(this.frequencies.length).fill(null);
            this.rightThresholds = new Array(this.frequencies.length).fill(null);
            this.selectedFrequency = this.frequencies[0];
        }

        this.observableVar = this.pageModel.currentPageObservable;
        this.observableVar.subscribe((updatedPage: PageInterface) => {
            const updatedAudiometryResponse = updatedPage?.responseArea as ManualAudiometryInterface;

            if (updatedAudiometryResponse) {
                this.maxOutputLevel = updatedAudiometryResponse.maxOutputLevel ?? 100;
                this.minOutputLevel = updatedAudiometryResponse.minOutputLevel ?? 0;
                this.currentDbSpl = updatedAudiometryResponse.currentDbSpl ?? 40;
                this.initialDbSpl = this.currentDbSpl; 
                this.frequencies = updatedAudiometryResponse.frequencies ?? [1, 2, 4];
                this.adjustments = updatedAudiometryResponse.adjustments ?? [5, -10];
                this.leftThresholds = new Array(this.frequencies.length).fill(null);
                this.rightThresholds = new Array(this.frequencies.length).fill(null);
                this.selectedFrequency = this.frequencies[0]; 
            }
        });
    }

    onFrequencyChange(selectedFreq: number): void {
        console.log("Selected Frequency:", selectedFreq);
        selectedFreq = Number(selectedFreq);
        console.log(typeof(selectedFreq));
        this.currentFrequencyIndex = this.frequencies.indexOf(selectedFreq);
        console.log("Updated Frequency Index:", this.currentFrequencyIndex);
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

    recordThreshold() {
        if (this.selectedEar === 'Left') {
            this.leftThresholds[this.currentFrequencyIndex] = this.currentDbSpl;
            // this.leftCurrentColumn = (this.leftCurrentColumn + 1) % 3;
        } else if (this.selectedEar === 'Right') {
            this.rightThresholds[this.currentFrequencyIndex] = this.currentDbSpl;
            // this.rightCurrentColumn = (this.rightCurrentColumn + 1) % 3;
        }
        this.currentFrequencyIndex = (this.currentFrequencyIndex + 1) % this.frequencies.length;
        this.selectedFrequency = this.frequencies[this.currentFrequencyIndex];
        this.currentDbSpl = this.initialDbSpl;
    }
}