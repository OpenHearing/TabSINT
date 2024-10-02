import { Injectable } from '@angular/core';
import { DevicesModel } from '../models/devices/devices.service';
import { DevicesInterface } from '../models/devices/devices.interface';
import { ConnectedDevice, NewConnectedDevice } from '../interfaces/connected-device.interface';
import { DeviceState } from './constants';

@Injectable({
    providedIn: 'root',
})

export class DeviceUtil {
    devices: DevicesInterface;

    constructor(
        private readonly devicesModel: DevicesModel
    ) {
        this.devices = this.devicesModel.getDevices();
    }

    updateDeviceState(deviceId:string|undefined,newState:DeviceState) {
        // TODO: expand this function for all device types (not just tympan)
        for (let i = 0; i < this.devices.connectedDevices.tympan.length; i++) {
            if (this.devices.connectedDevices.tympan[i].deviceId==deviceId) {
              this.devices.connectedDevices.tympan[i].state = newState;
            }
        }
    }

    getNextFreeTabsintId() {
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

    createDeviceConnection(newConnection:NewConnectedDevice):ConnectedDevice {
        let connection: ConnectedDevice = {
            "type": newConnection.type,
            "tabsintId": this.getNextFreeTabsintId(),
            "deviceId": newConnection.deviceId!,
            "name": newConnection.name!,
            "state": DeviceState.Connected,
            "msgId": 0
        };
        return connection
    }

    incrementDeviceMsgId(device:ConnectedDevice) {
        // TODO: expand this function for all device types (if necessary)
        for (let i = 0; i < this.devices.connectedDevices.tympan.length; i++) {
            if (this.devices.connectedDevices.tympan[i].deviceId==device.deviceId) {
              this.devices.connectedDevices.tympan[i].msgId+=1;
            }
        }
    }

    removeDevice(device:ConnectedDevice) {
        // TODO: expand this function for all device types (not just tympan)
        let indexToRemove: number = -1;
        for (let i = 0; i < this.devices.connectedDevices.tympan.length; i++) {
            if (this.devices.connectedDevices.tympan[i].deviceId==device.deviceId) {
                indexToRemove = i;
            }
        }
        if (indexToRemove!=-1) {
            this.devices.connectedDevices.tympan.splice(indexToRemove, 1);
        }
    }
    
}