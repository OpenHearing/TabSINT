import { Injectable } from '@angular/core';
import { DevicesInterface } from './devices.interface';

@Injectable({
    providedIn: 'root',
})

export class DevicesModel {

    devicesModel: DevicesInterface = {
        name: "name"
    }

    getDevices(): DevicesInterface {
        return this.devicesModel;
    }
}