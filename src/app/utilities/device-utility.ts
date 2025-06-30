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
    devices: DevicesInterface;
    disk: DiskInterface;
    diskSubscription: Subscription | undefined;

    constructor(private readonly devicesModel: DevicesModel, private readonly diskModel: DiskModel) {
        this.devices = this.devicesModel.getDevices();
        this.disk = this.diskModel.getDisk();
        this.diskSubscription = this.diskModel.diskSubject.subscribe( (updatedDisk: DiskInterface) => {
            this.disk = updatedDisk;
        })    
    }

    updateDeviceState(deviceId: string|undefined, newState: DeviceState): boolean {
        let wasDeviceStateUpdated: boolean = false;
        for (const device of this.devices.connectedDevices.tympan) {
            if (device.deviceId === deviceId) {
                device.state = newState;
                wasDeviceStateUpdated = true;
            }
        }
        return wasDeviceStateUpdated
    }

    getNextFreeTabsintId(): string {
        let nextFreeId: string = "1";
        let takenIds: Array<string> = [];
        for (const [ , deviceType] of Object.entries(this.devices.connectedDevices)) {
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

    incrementDeviceMsgId(deviceId: string): void {
        for (const device of this.devices.connectedDevices.tympan) {
            if (device.deviceId === deviceId) {
                if (device.msgId>=99) {
                    device.msgId=1;
                } else {
                    device.msgId+=1;
                }
            }
        }
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

    removeDevice(device: ConnectedDevice): boolean {
        let wasDeviceRemoved = false;
        let indexToRemove: number = -1;
        for (let i = 0; i < this.devices.connectedDevices.tympan.length; i++) {
            if (this.devices.connectedDevices.tympan[i].deviceId==device.deviceId) {
                indexToRemove = i;
            }
        }
        if (indexToRemove !== -1) {
            this.devices.connectedDevices.tympan.splice(indexToRemove, 1);
            wasDeviceRemoved = true;
        }
        return wasDeviceRemoved
    }

    getTabsintIdFromDeviceId(deviceId: string): string|undefined {
        let tabsintId: string|undefined;
        for (const [ , deviceType] of Object.entries(this.devices.connectedDevices)) {
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
        for (const [ , deviceType] of Object.entries(this.devices.connectedDevices)) {
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
        for (const [ , deviceType] of Object.entries(this.devices.connectedDevices)) {
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

    updateDeviceInfo(tabsintId: string, info: {[key: string]: string}): boolean {
        let wasDeviceInfoUpdated = false;
        for (const device of this.devices.connectedDevices.tympan) {
            if (device.tabsintId === tabsintId) {
                device.description = info?.["description"];
                device.buildDateTime = info?.["buildDateTime"];
                device.serialNumber = info?.["serialNumber"];
                wasDeviceInfoUpdated = true;
            }
        }
        return wasDeviceInfoUpdated
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

    addSavedDevices(): void {
        for (const device of this.disk.savedDevices.tympan) {
            let savedConnection: ConnectedDevice = {
                "type": "Tympan",
                "tabsintId": device.tabsintId,
                "deviceId": device.deviceId,
                "name": device.name,
                "state": DeviceState.Disconnected,
                "msgId": 1,
                "maxByteLength": device.maxByteLength
            };
            this.devices.connectedDevices.tympan.push(savedConnection);
        }
    }
}