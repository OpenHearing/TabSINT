import { Injectable } from '@angular/core';
import { ResultsInterface } from './results.interface';

@Injectable({
    providedIn: 'root',
})

export class ResultsModel {

    resultsModel: ResultsInterface = {
        name: "name",
        state: {
            mode: "FINALIZED", // looks like it can be ['NOT-READY','FINALIZED','READY','TESTING']
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
        },
        current: {
            qrString: "qrString",
            siteId: "siteId",
            elapsedTime: "elapsedTime",
            testDateTime: "2024-01-31T16:13:53.769Z",
            protocolName: "protocolName",
            testResults: {
                responses: [
                    {
                        presentationId: "presentationId1",
                        response: "response1",
                        correct: 'true',
                    },
                    {
                        presentationId: "presentationId2",
                        response: "response2",
                        correct: 'false',
                    },
                    {
                        presentationId: "presentationId3",
                        response: "response3",
                        correct: 'undefined',
                    }
                ]
            }
        }
    }

    getResults(): ResultsInterface {
        return this.resultsModel;
    }

}