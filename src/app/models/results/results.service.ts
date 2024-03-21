import { Injectable } from '@angular/core';
import { ResultsInterface } from './results.interface';

@Injectable({
    providedIn: 'root',
})

export class ResultsModel {

    resultsModel: ResultsInterface = {
        name: "name",
        state: {
            mode: "READY", // looks like it can be ['NOT-READY','FINALIZED','READY','TESTING']
            progress: {
                pctProgress: "1"
            }
        },
        page: {
            enableBackButton: true,
            hideProgressBar: false,
            helpText: "helpText",
            submitText: undefined,
            isSubmittable: true,
            canGoBack: Function,
            responseArea: {
                enableSkip: true,
                type: "type"
            },
            title: "title",
            instructionText: "instructionText",
            subtitle: "subtitle",
            // image: {
            //     path: "path"
            // },
            image: undefined,
            questionSubText: "questionSubText",
            questionMainText: "questionMainText",
            loadingRequired: false,
            loadingActive: false
        }
    }

    getResults(): ResultsInterface {
        return this.resultsModel;
    }

}