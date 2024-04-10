import { Injectable } from '@angular/core';
import { ResultsInterface } from './results.interface';

@Injectable({
    providedIn: 'root',
})

export class ResultsModel {

    resultsModel: ResultsInterface = {
        name: "name",
        current: {
            qrString: "qrString",
            siteId: "siteId",
            elapsedTime: "elapsedTime",
            testDateTime: "2024-01-31T16:13:53.769Z",
            protocolName: "protocolName",
            response: "resp",
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
        },
        previous: []
    }

    getResults(): ResultsInterface {
        return this.resultsModel;
    }

}