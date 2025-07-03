import { Injectable } from '@angular/core';
import { Subscription } from 'rxjs';
import { DevicesInterface, TympanResponse } from '../models/devices/devices.interface';
import { DiskInterface } from '../models/disk/disk.interface';
import { ConnectedDevice, NewConnectedDevice } from '../interfaces/connected-device.interface';
import { DevicesModel } from '../models/devices/devices-model.service';
import { DiskModel } from '../models/disk/disk.service';
import { DeviceState } from './constants';
import { PendingMsgInfo } from '../interfaces/pending-msg-info.interface';

@Injectable({
    providedIn: 'root',
})

export class DeviceUtil {
    devices?: DevicesInterface;
    disk: DiskInterface;
    diskSubscription: Subscription | undefined;

    constructor(private readonly devicesModel: DevicesModel, private readonly diskModel: DiskModel) {
        this.disk = this.diskModel.getDisk();
        this.diskSubscription = this.diskModel.diskSubject.subscribe( (updatedDisk: DiskInterface) => {
            this.disk = updatedDisk;
        })  
        this.devicesModel.devicesModel$.subscribe( (value: DevicesInterface) => {
            this.devices = value;
        })   
    }

    getNextFreeTabsintId(): string {
        let nextFreeId: string = "1";
        let takenIds: Array<string> = [];
        for (const [ , deviceType] of Object.entries(this.devices?.connectedDevices ?? [])) {
            deviceType.forEach( (device: ConnectedDevice) => {
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

    createDeviceConnection(newConnection: NewConnectedDevice): ConnectedDevice {
        let connection: ConnectedDevice = {
            "type": newConnection.type,
            "tabsintId": this.getNextFreeTabsintId(),
            "deviceId": newConnection.deviceId!,
            "name": newConnection.name!,
            "state": DeviceState.Connected,
            "msgId": 1,
            "maxByteLength": newConnection.maxByteLength!
        };
        return connection
    }

    isResponseInvalidChecksum(response: TympanResponse): boolean {
        if (response.msg === 'invalid checksum') {
            return true;
        } else {
            return false;
        }
    }

    doTympanResponseMsgIdsMatch(expectedMsgInfo: PendingMsgInfo|null, response: TympanResponse): boolean {
        let resp = false;
        console.log("expectedMsgInfo: ", expectedMsgInfo);
        console.log("response: ", response);
        if (expectedMsgInfo!.tabsintId === parseInt(response.tabsintId)) {
            if (-parseInt(expectedMsgInfo!.msgId) === JSON.parse(response.msg)[0]) {
                resp = true;
            }
        }        
        return resp;
    }

    getTabsintIdFromDeviceId(deviceId: string): string|undefined {
        let tabsintId: string|undefined;
        for (const [ , deviceType] of Object.entries(this.devices?.connectedDevices ?? [])) {
            deviceType.forEach( (device: ConnectedDevice) => {
                if (device.deviceId === deviceId) {
                    tabsintId = device.tabsintId;
                }
            });
        }
        return tabsintId
    }

    getDeviceFromDeviceId(deviceId: string): ConnectedDevice|undefined {
        let connection: ConnectedDevice|undefined;
        for (const [ , deviceType] of Object.entries(this.devices?.connectedDevices ?? [])) {
            deviceType.forEach( (device: ConnectedDevice) => {
                if (device.deviceId === deviceId) {
                    connection = device;
                }
            });
        }
        return connection
    }

    getDeviceFromTabsintId(tabsintId:string): ConnectedDevice|undefined {
        let connection: ConnectedDevice|undefined;
        for (const [ , deviceType] of Object.entries(this.devices?.connectedDevices ?? [])) {
            deviceType.forEach( (device: ConnectedDevice) => {
                if (device.tabsintId === tabsintId) {
                    connection = device;
                }
            });
        }
        return connection
    }

    getMaxByteLengthFromDeviceId(tabsintId:string): number {
        let device = this.getDeviceFromDeviceId(tabsintId);
        return device?.maxByteLength!
    }
    
    addNewSavedDevice(connection: ConnectedDevice): void {
        let savedDevice = {
            "tabsintId": connection.tabsintId,
            "name": connection.name,
            "deviceId": connection.deviceId,
            "maxByteLength": connection.maxByteLength
        };
        let savedDevices = JSON.parse(JSON.stringify(this.disk.savedDevices));
        savedDevices.tympan.push(savedDevice);
        this.diskModel.updateDiskModel('savedDevices', savedDevices);
    }

    removeSavedDevice(connection: ConnectedDevice): void {
        let savedDevices = this.disk.savedDevices;
        for (const device of this.disk.savedDevices.tympan) {
            if (device.tabsintId === connection.tabsintId) {
                let indexToRemove = this.disk.savedDevices.tympan.indexOf(connection);
                savedDevices.tympan.splice(indexToRemove, 1);
                this.diskModel.updateDiskModel('savedDevices', savedDevices);
            }
        }
    }
}