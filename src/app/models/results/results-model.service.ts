import { Injectable } from '@angular/core';
import { ResultsInterface } from './results.interface';
import { pageInterfaceDefaults, protocolDefaults } from '../../utilities/defaults';
import { DevicesInterface } from '../devices/devices.interface';
import { DevicesModel } from '../devices/devices-model.service';
import { VersionModel } from '../version/version.service';

@Injectable({
    providedIn: 'root',
})

export class ResultsModel {

    private resultsModel: ResultsInterface;
    private devices?: DevicesInterface;

    constructor(
        private readonly devicesModel: DevicesModel,
        private readonly versionModel: VersionModel
    ) {
        this.devicesModel.devicesModel$.subscribe( (value: DevicesInterface) => {
            this.devices = value;
        })  
        this.resultsModel = {
            currentPage: {
                pageId: '',
                page: pageInterfaceDefaults
            },
            currentExam: {
                protocolName: '',
                protocolId: '',
                protocol: protocolDefaults,
                responses: [],
                softwareVersion: this.versionModel.version,
                tabletLocation: { //unimplemented
                },
                devices: this.devices,
                headset: 'None',
                calibrationVersion: '0.0'
            }
        }
    }

    getResults(): ResultsInterface {
        return this.resultsModel;
    }

}