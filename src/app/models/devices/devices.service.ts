import { Injectable } from '@angular/core';
import { DevicesInterface } from './devices.interface';

@Injectable({
    providedIn: 'root',
})

export class DevicesModel {

    devicesModel: DevicesInterface = {
        build: "build",
        protocolId: "protocolId",
        uuid: "uuid",
        tabsintUUID: "tabsintUUID",
        version: "version",
        platform: "platform",
        model: "model",
        os: "os",
        other: "other"
    }

    getDevices(): DevicesInterface {
        return this.devicesModel;
    }
}