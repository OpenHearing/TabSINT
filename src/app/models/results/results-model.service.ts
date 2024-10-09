import { Injectable } from '@angular/core';
import { ResultsInterface } from './results.interface';
import { protocolDefaults } from '../../utilities/defaults';
import { DevicesModel } from '../devices/devices-model.service';
import { VersionModel } from '../version/version.service';

@Injectable({
    providedIn: 'root',
})

export class ResultsModel {

    resultsModel: ResultsInterface;

    constructor(
        private readonly devicesModel: DevicesModel,
        private readonly versionModel: VersionModel
    ) {
        this.resultsModel = {
            currentPage: {
                pageId: '',
                page: {}
            },
            currentExam: {
                protocolName: '',
                protocolId: '',
                protocol: protocolDefaults,
                responses: [],
                softwareVersion: this.versionModel.version,
                tabletLocation: { //unimplemented
                },
                devices: this.devicesModel.getDevices(),
                headset: 'None',
                calibrationVersion: '0.0'
            }
        }
    }

    getResults(): ResultsInterface {
        return this.resultsModel;
    }

}