import { Component, OnDestroy, OnInit } from "@angular/core";
import { Subscription } from "rxjs";

import { PageInterface } from "../../../../models/page/page.interface";
import { ResultsInterface } from "../../../../models/results/results.interface";
import { ManualAudiometryResultViewerInterface } from "./manual-audiometry-result-viewer.interface";

import { PageModel } from "../../../../models/page/page.service";
import { ResultsModel } from "../../../../models/results/results-model.service";
import { Logger } from "../../../../utilities/logger.service";

interface ResponsesInterface {
    frequencies: number[],
    leftThresholds: (number|null)[],
    rightThresholds: (number|null)[],
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
                    .filter((response: { pageId: string; }) => updatedAudiometryResponseAreaResultViewer.pageIdsToDisplay.includes(response.pageId))
                    .map( (response: any) => ({
                        frequencies: response.page.responseArea.frequencies,
                        leftThresholds: response.response.leftThresholds,
                        rightThresholds: response.response.rightThresholds,
                }));

            }
        });
    }
    
    ngOnDestroy() {
        this.pageSubscription?.unsubscribe();
    }

}