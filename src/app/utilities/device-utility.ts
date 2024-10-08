import { Injectable } from '@angular/core';
import { DevicesModel } from '../models/devices/devices-model.service';
import { DevicesInterface } from '../models/devices/devices.interface';
import { ConnectedDevice, NewConnectedDevice } from '../interfaces/connected-device.interface';
import { DeviceState } from './constants';
import { DiskInterface } from '../models/disk/disk.interface';
import { DiskModel } from '../models/disk/disk.service';

@Injectable({
    providedIn: 'root',
})

export class DeviceUtil {
    devices: DevicesInterface;
    disk: DiskInterface;

    constructor(private readonly devicesModel: DevicesModel, private readonly diskModel: DiskModel) {
        this.devices = this.devicesModel.getDevices();
        this.disk = this.diskModel.getDisk();
    }

    updateDeviceState(deviceId: string|undefined, newState: DeviceState) {
        // TODO: expand this function for all device types (not just tympan)
        for (const device of this.devices.connectedDevices.tympan) {
            if (device.deviceId==deviceId) {
                device.state = newState;
            }
        }
    }

    getNextFreeTabsintId() {
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
            "msgId": 1
        };
        return connection
    }

    incrementDeviceMsgId(deviceId: string) {
        // TODO: expand this function for all device types (if necessary)
        for (const device of this.devices.connectedDevices.tympan) {
            if (device.deviceId==deviceId) {
                if (device.msgId>=99) {
                    device.msgId=1;
                } else {
                    device.msgId+=1;
                }
            }
        }
    }

    removeDevice(device: ConnectedDevice) {
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

    getTabsintIdFromDeviceId(deviceId: string) {
        let tabsintId: string|undefined;
        for (const [ , deviceType] of Object.entries(this.devices.connectedDevices)) {
            deviceType.forEach( (device: ConnectedDevice) => {
                if (device.deviceId==deviceId) {
                    tabsintId = device.tabsintId;
                }
            });
        }
        return tabsintId
    }

    getDeviceFromDeviceId(deviceId: string) {
        let connection: ConnectedDevice|undefined;
        for (const [ , deviceType] of Object.entries(this.devices.connectedDevices)) {
            deviceType.forEach( (device: ConnectedDevice) => {
                if (device.deviceId==deviceId) {
                    connection = device;
                }
            });
        }
        return connection
    }

    getDeviceFromTabsintId(tabsintId:string) {
        let connection: ConnectedDevice|undefined;
        for (const [ , deviceType] of Object.entries(this.devices.connectedDevices)) {
            deviceType.forEach( (device: ConnectedDevice) => {
                if (device.tabsintId==tabsintId) {
                    connection = device;
                }
            });
        }
        return connection
    }

    updateDeviceInfo(tabsintId: string, info: {[key: string]: string}) {
        // TODO: expand this function for all device types (not just tympan)
        for (const device of this.devices.connectedDevices.tympan) {
            if (device.tabsintId==tabsintId) {
                device.description = info?.["description"];
                device.buildDateTime = info?.["buildDateTime"];
                device.serialNumber = info?.["serialNumber"];
            }
        }
    }
    
    addNewSavedDevice(connection: ConnectedDevice) {
        // TODO: expand this function for all device types (not just tympan)
        let savedDevice = {
            "tabsintId": connection.tabsintId,
            "name": connection.name,
            "deviceId": connection.deviceId
        };
        let savedDevices = JSON.parse(JSON.stringify(this.disk.savedDevices));
        savedDevices.tympan.push(savedDevice);
        this.diskModel.updateDiskModel('savedDevices',savedDevices);
        this.disk = this.diskModel.getDisk();
        console.log("this.disk",this.disk);
    }

    removeSavedDevice(connection: ConnectedDevice) {
        // TODO: expand this function for all device types (not just tympan)
        let savedDevices = this.disk.savedDevices;
        for (const device of this.disk.savedDevices.tympan) {
            if (device.tabsintId==connection.tabsintId) {
                let indexToRemove = this.disk.savedDevices.tympan.indexOf(connection);
                savedDevices.tympan.splice(indexToRemove, 1);
                this.diskModel.updateDiskModel('savedDevices',savedDevices);
                this.disk = this.diskModel.getDisk();
            }
        }
    }

    addSavedDevices() {
        // TODO: expand to other devices as well
        console.log("this.disk",this.disk);
        console.log("this.disk.savedDevices.tympan",this.disk.savedDevices.tympan);
        for (const device of this.disk.savedDevices.tympan) {
            let savedConnection: ConnectedDevice = {
                "type": "Tympan",
                "tabsintId": device.tabsintId,
                "deviceId": device.deviceId,
                "name": device.name,
                "state": DeviceState.Disconnected,
                "msgId": 1
            };
            console.log("savedConnection",savedConnection);
            this.devices.connectedDevices.tympan.push(savedConnection);
            console.log("this.devices.connectedDevices",this.devices.connectedDevices);
        }
    }
}