import { Injectable } from '@angular/core';
import { ResultsInterface } from './results.interface';
import { protocolDefaults } from '../../utilities/defaults';

@Injectable({
    providedIn: 'root',
})

export class ResultsModel {

    resultsModel: ResultsInterface = {
        currentPage: {
            pageId: '',
            page: {}
        },
        currentExam: {
            protocolName: '',
            protocolId: '',
            protocol: protocolDefaults,
            responses: [],
            softwareVersion: {},
            tabletLocation: { //unimplemented
            },
            headset: 'None',
            calibrationVersion: {}
        }
    }

    getResults(): ResultsInterface {
        return this.resultsModel;
    }

}