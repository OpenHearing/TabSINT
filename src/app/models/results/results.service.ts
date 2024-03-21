import { Injectable } from '@angular/core';
import { ResultsInterface } from './results.interface';

@Injectable({
    providedIn: 'root',
})

export class ResultsModel {

    resultsModel: ResultsInterface = {
        name: "name",
        state: {
            mode: "TESTING", // looks like it can be ['NOT-READY','FINALIZED','READY','TESTING']
            progress: {
                pctProgress: "1"
            }
        },
        page: {
            enableBackButton: true,
            hideProgressBar: false,
            helpText: "helpText",
            submitText: "submitText",
            isSubmittable: true,
            canGoBack: Function,
            responseArea: {
                enableSkip: true
            }
        }
    }

    getResults(): ResultsInterface {
        return this.resultsModel;
    }

}