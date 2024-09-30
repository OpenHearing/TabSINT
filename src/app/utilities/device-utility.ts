import { Injectable } from '@angular/core';
import { DevicesModel } from '../models/devices/devices.service';
import { DevicesInterface } from '../models/devices/devices.interface';
import { ConnectedDevice } from '../interfaces/new-device.interface';
import { TympanState } from './constants';

@Injectable({
    providedIn: 'root',
})

export class DeviceUtil {
    devices: DevicesInterface;

    constructor(
        private devicesModel: DevicesModel
    ) {
        this.devices = this.devicesModel.getDevices();
    }

    updateDeviceState(deviceId:string|undefined,newState:TympanState) {
        for (let i = 0; i < this.devices.connectedDevices.tympan.length; i++) {
            if (this.devices.connectedDevices.tympan[i].deviceId==deviceId) {
              this.devices.connectedDevices.tympan[i].state = newState;
            }
          }
    }

    getNextFreeDeviceId() {
        let nextFreeId: string = "1";
        let takenIds: Array<string> = [];
        for (const [ , deviceType] of Object.entries(this.devices.connectedDevices)) {
            deviceType.forEach( (device:ConnectedDevice) => {
                if (device.tabsintId) {
                    takenIds.push(device.tabsintId);
                }
            });
        }
        while (takenIds.includes(nextFreeId)) {
            nextFreeId = (parseInt(nextFreeId)+1).toString();
        }
        return nextFreeId
    } 
    
}