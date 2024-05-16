import { Injectable } from '@angular/core';
import { ResultsInterface } from '../models/results/results.interface';
import { ResultsModel } from '../models/results/results-model.service';

@Injectable({
    providedIn: 'root',
})

export class ResultsService {
    results: ResultsInterface;
    
    constructor (
        public resultsModel: ResultsModel
    ) {
        this.results = this.resultsModel.getResults();
    }
    
    /** Initializes results after starting a new page.
     * @summary Initializes results with pageID and other information. 
     * @param currentPage exam page to initialize.
     * @models results
    */
    initializeResults(currentPage:any) {
        console.log("ResultsService initializeResults() called");

        this.results.current = {}; 
        //TODO: Update this to get correct and all necessary information
        /* This should include the ID for current page?
        Can we have multiple results from same pages with repeated ID? Or would it overwrite the exam?
        This seems rather complicated in current tabsint. I think just having results for each page will work.
        If the page comes up again the ID wont duplicate and instead we overwrite the results for that page. 
        This would mean that pushing results needs logic to overwrite if it already exists.
        */
        this.results.current.pageID = currentPage.id;
        this.results.current.responseArea = currentPage.responseArea;
    }

    /**
     * Save exam results
     * @summary summary
     * @models models
     * @param parameter: description
     * @returns description:  type
     */
    save() {
        // unimplemented
    }
}