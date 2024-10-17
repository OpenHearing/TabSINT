import { Component, OnDestroy, OnInit } from "@angular/core";
import { Subscription } from "rxjs";

import { PageInterface } from "../../../../models/page/page.interface";
import { ResultsInterface } from "../../../../models/results/results.interface";
import { ManualAudiometryResultViewerInterface } from "./manual-audiometry-result-viewer.interface";

import { PageModel } from "../../../../models/page/page.service";
import { ResultsModel } from "../../../../models/results/results-model.service";
import { Logger } from "../../../../utilities/logger.service";

interface ResponsesInterface {
    title?: string;
    questionMainText?: string;
    questionSubText?: string;
    instructionText?: string;
    frequencies: number[];
    leftThresholds: (number|null)[];
    rightThresholds: (number|null)[];
}

interface AudiogramDataInterface {
    frequencies: number[],
    thresholds: (number|null)[],
    channels: string[],
    resultTypes: string[],
    masking: boolean[]
  }

@Component({
    selector: 'manual-audiometry-result-viewer-view',
    templateUrl: './manual-audiometry-result-viewer.html',
    styleUrl: './manual-audiometry-result-viewer.css'
  })

export class ManualAudiometryResultViewerComponent implements OnInit, OnDestroy {
    currentPage: PageInterface;
    results: ResultsInterface;
    responses: ResponsesInterface[] = [{
        frequencies: [1, 2, 4],
        leftThresholds: [null, null, null],
        rightThresholds: [null, null, null],
    }]
    audiogramData: AudiogramDataInterface[] = [{
        frequencies: [1000],
        thresholds: [null],
        channels: [''],
        resultTypes: [''],
        masking: [false]
    }];
    pageSubscription: Subscription | undefined;

    constructor(
        private readonly resultsModel: ResultsModel, 
        private readonly pageModel: PageModel, 
        private readonly logger: Logger
    ) {
        this.results = this.resultsModel.getResults();
        this.currentPage = this.pageModel.getPage();
    }

    ngOnInit() {
        this.pageSubscription = this.pageModel.currentPageSubject.subscribe(async (updatedPage: PageInterface) => {
            if (updatedPage?.responseArea?.type == "manualAudiometryResponseAreaResultViewer") {
                const updatedAudiometryResponseAreaResultViewer = updatedPage?.responseArea as ManualAudiometryResultViewerInterface;

                this.responses = this.results.currentExam.responses
                    .filter((response: { pageId: string; }) => 
                        updatedAudiometryResponseAreaResultViewer.pageIdsToDisplay.includes(response.pageId))
                    .map( (response: any) => ({
                        title: response.page.title,
                        questionMainText: response.page.questionMainText,
                        questionSubText: response.page.questionSubText,
                        instructionText: response.page.instructionText,
                        frequencies: response.page.responseArea.frequencies,
                        leftThresholds: response.response.leftThresholds,
                        rightThresholds: response.response.rightThresholds,
                }));

                this.audiogramData = this.results.currentExam.responses
                    .filter((response: { pageId: string; }) => 
                        updatedAudiometryResponseAreaResultViewer.pageIdsToDisplay.includes(response.pageId))
                    .map( (response: any) => {

                        const leftThresholds = response.response.leftThresholds || [];
                        const rightThresholds = response.response.rightThresholds || [];
                        const frequencies = response.page.responseArea.frequencies;

                        const leftChannels = Array(leftThresholds.length).fill('left');
                        const rightChannels = Array(rightThresholds.length).fill('right');
                        const channels = leftChannels.concat(rightChannels);

                        const masking = Array(channels.length).fill(false);
                        const resultTypes = Array(channels.length).fill('Threshold');
                
                        return {
                            frequencies: frequencies.concat(frequencies),
                            thresholds: leftThresholds.concat(rightThresholds),
                            channels,
                            resultTypes,
                            masking,
                        };
                    });
            }
        });
    }
    
    ngOnDestroy() {
        this.pageSubscription?.unsubscribe();
    }

}