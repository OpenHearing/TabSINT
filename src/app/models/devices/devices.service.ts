import { Injectable } from '@angular/core';
import { DevicesInterface, DeviceResponse } from './devices.interface';
import { Device } from '@capacitor/device';
import { Logger } from '../../utilities/logger.service';
import { BehaviorSubject, Subject } from 'rxjs';
import { BleDevice } from '../../interfaces/bluetooth.interface';

@Injectable({
    providedIn: 'root',
})

export class DevicesModel {

    devicesModel: DevicesInterface = {
        build: "build",
        protocolId: "protocolId",
        uuid: "uuid",
        // tabsintUUID: "tabsintUUID",
        version: "version",
        platform: "platform",
        model: "model",
        os: "os",
        other: "other",
        diskspace: "Unknown",
        connectedDevices: {
            "tympan":[],
            "cha":[],
            "svantek":[]
        }
    }

    availableDevicesSubject = new BehaviorSubject<BleDevice[]>([]); // TODO: Should this be moved into a more specific model/service?
    deviceResponseSubject = new Subject<DeviceResponse>(); // TODO: Should this be moved into response specific model/service?

    constructor(private readonly logger: Logger) {
        // TODO: Move this to generic utility for running async functions in constructor
        setTimeout( async () => {
            await this.load();
        }, 0);
    }

    async load() {
        try {
            const info = await Device.getInfo();
            const batteryInfo = await Device.getBatteryInfo();
            const languageCode = await Device.getLanguageCode();
            const id = await Device.getId();
            this.devicesModel.build = info.manufacturer ?? 'Unknown';
            this.devicesModel.protocolId = 'some-protocol-id'; 
            this.devicesModel.uuid = id.identifier;
            // this.devicesModel.tabsintUUID =  "tabsintUUID";
            this.devicesModel.version = info.osVersion ?? 'Unknown';
            this.devicesModel.platform = info.platform ?? 'Unknown';
            this.devicesModel.model = info.model ?? 'Unknown';
            this.devicesModel.os = info.operatingSystem;
            this.devicesModel.other = `Battery level: ${batteryInfo.batteryLevel ?? 'Unknown'}, Language: ${languageCode.value ?? 'Unknown'}`;
            if (info.realDiskFree !== undefined) {
                this.devicesModel.diskspace = String(Math.round(info.realDiskFree / (1024 * 1024)));
            }
                this.logger.debug("Device info processed -- \n" + JSON.stringify((this.devicesModel)));
        } catch (error) {
                this.logger.debug("Device info not available");
        }
    }

    getDevices(): DevicesInterface {
        return this.devicesModel;
    }
}