import { Injectable } from '@angular/core';
import { DevicesInterface, TympanResponse } from './devices.interface';
import { Device } from '@capacitor/device';
import { Logger } from '../../utilities/logger.service';
import { DeviceState } from '../../utilities/constants';
import { ConnectedDevice } from '../../interfaces/connected-device.interface';
import { BehaviorSubject, Subject, map } from 'rxjs';
import { BleDevice } from '../../interfaces/bluetooth.interface';
import { SavedDevices } from '../disk/disk.interface';
import { NgZone } from '@angular/core';

@Injectable({
    providedIn: 'root',
})

export class DevicesModel {
    availableDevicesSubject = new BehaviorSubject<BleDevice[]>([]);
    tympanResponseSubject = new Subject<TympanResponse>();

    private devicesModelSubject = new BehaviorSubject<DevicesInterface>({
        build: "build",
        uuid: "uuid",
        // tabsintUUID: "tabsintUUID",
        version: "version",
        platform: "platform",
        model: "model",
        os: "os",
        other: "other",
        diskspace: "Unknown",
        connectedDevices: {
            "tympan": [],
            "cha": [],
            "svantek": []
        }
    });

    /**
     * Observable for devices model data which outputs a structured clone of the object.
     */
    readonly devicesModel$ = this.devicesModelSubject.asObservable().pipe(map(value => structuredClone(value)));

    constructor(private readonly logger: Logger, private readonly zone: NgZone) {
        // TODO: Move this to generic utility for running async functions in constructor
        setTimeout(async () => {
            await this.load();
        }, 0);
    }

    public async load() {
        try {
            const info = await Device.getInfo();
            const batteryInfo = await Device.getBatteryInfo();
            const languageCode = await Device.getLanguageCode();
            const id = await Device.getId();
            const devicesModel = this.getDevicesModelCopy();
            devicesModel.build = info.manufacturer ?? 'Unknown';
            devicesModel.uuid = id.identifier;
            // this.devicesModel.tabsintUUID =  "tabsintUUID";
            devicesModel.version = info.osVersion ?? 'Unknown';
            devicesModel.platform = info.platform ?? 'Unknown';
            devicesModel.model = info.model ?? 'Unknown';
            devicesModel.os = info.operatingSystem;
            devicesModel.other = `Battery level: ${batteryInfo.batteryLevel ?? 'Unknown'}, Language: ${languageCode.value ?? 'Unknown'}`;
            if (info.realDiskFree !== undefined) {
                devicesModel.diskspace = String(Math.round(info.realDiskFree / (1024 * 1024)));
            }
            this.setDevices(devicesModel);
            this.logger.debug("Device info processed -- \n" + JSON.stringify((devicesModel)));
        } catch (error) {
            this.logger.debug("Device info not available");
        }
    }

    /**
     * Set the current devices model data using a copy.
     * @param devicesModel The data to update the device model with.
     */
    private setDevices(devices: DevicesInterface) {
        // This is a hack needed to ensure an update is pushed inside the angular zone updates.
        this.zone.run(() => this.devicesModelSubject.next(structuredClone(devices)))
    }

    /**
     * Get a copy of the devices model data.
     * @returns A deep copy of the devices model data.
     */
    private getDevicesModelCopy(): DevicesInterface {
        return structuredClone(this.devicesModelSubject.getValue())
    }

    /**
     * Update the state of the provided device id.
     * @param deviceId The device for the state update.
     * @param newState The new state of the device.
     * @returns True if the device state was updated, otherwise false.
     */
    public updateDeviceState(deviceId: string | undefined, newState: DeviceState): boolean {
        let wasDeviceStateUpdated: boolean = false;
        const devicesModel = this.getDevicesModelCopy();

        for (const device of devicesModel.connectedDevices.tympan) {
            if (device.deviceId === deviceId) {
                device.state = newState;
                wasDeviceStateUpdated = true;
            }
        }
        this.setDevices(devicesModel);
        return wasDeviceStateUpdated
    }

    /***
     * Increment the message id for the provided device.
     * @param deviceId The device for the message id increment.
     */
    public incrementDeviceMsgId(deviceId: string): void {
        const devicesModel = this.getDevicesModelCopy();

        for (const device of devicesModel.connectedDevices.tympan) {
            if (device.deviceId === deviceId) {
                if (device.msgId >= 99) {
                    device.msgId = 1;
                } else {
                    device.msgId += 1;
                }
            }
        }
        this.setDevices(devicesModel);
    }

    /**
     * Remove the specified device from the connected devices.
     * @param device The device to remove. 
     * @returns True if the device was removed, false otherwise.
     */
    public removeDevice(device: ConnectedDevice): boolean {
        let wasDeviceRemoved = false;
        const devicesModel = this.getDevicesModelCopy();

        let indexToRemove: number = -1;
        for (let i = 0; i < devicesModel.connectedDevices.tympan.length; i++) {
            if (devicesModel.connectedDevices.tympan[i].deviceId==device.deviceId) {
                indexToRemove = i;
            }
        }
        if (indexToRemove !== -1) {
            devicesModel.connectedDevices.tympan.splice(indexToRemove, 1);
            wasDeviceRemoved = true;
        }
        this.setDevices(devicesModel);
        return wasDeviceRemoved
    }

    /**
     * Update the device information for the provided device.
     * @param tabsintId The device to be updated.
     * @param info The information to update the device with.
     * @returns True if the device information was updated, false otherwise.
     */
    public updateDeviceInfo(tabsintId: string, info: {[key: string]: string}): boolean {
        let wasDeviceInfoUpdated = false;
        const devicesModel = this.getDevicesModelCopy();

        for (const device of devicesModel.connectedDevices.tympan) {
            if (device.tabsintId === tabsintId) {
                device.description = info?.["description"];
                device.buildDateTime = info?.["buildDateTime"];
                device.serialNumber = info?.["serialNumber"];
                wasDeviceInfoUpdated = true;
            }
        }
        this.setDevices(devicesModel);
        return wasDeviceInfoUpdated
    }

    /**
     * Add a tympan device to the devices model.
     * @param device The device to be added to the tympan connected devices.
     */
    public addTympanConnectedDevice(device: ConnectedDevice): void {
        const devicesModel = this.getDevicesModelCopy();

        devicesModel.connectedDevices.tympan.push(device);
        this.setDevices(devicesModel);
    }

    /**
     * Add saved tympan devices to the devices model.
     * @param savedDevices The saved devices to be added to the devices model.
     */
    public addSavedDevices(savedDevices: SavedDevices): void {
        const devicesModel = this.getDevicesModelCopy();

        for (const device of savedDevices.tympan) {
            let savedConnection: ConnectedDevice = {
                "type": "Tympan",
                "tabsintId": device.tabsintId,
                "deviceId": device.deviceId,
                "name": device.name,
                "state": DeviceState.Disconnected,
                "msgId": 1,
                "maxByteLength": device.maxByteLength
            };
            devicesModel.connectedDevices.tympan.push(savedConnection);
        }
        this.setDevices(devicesModel);
    }
}