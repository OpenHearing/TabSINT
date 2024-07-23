import { Inject, Injectable,PLATFORM_ID } from '@angular/core';
import { DevicesInterface } from './devices.interface';
import { Device } from '@capacitor/device';
import { Logger } from '../../utilities/logger.service';
import { isPlatformBrowser } from '@angular/common';

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
        other: "other",
        diskspace: "Unknown"
    }

    constructor(private logger: Logger,@Inject(PLATFORM_ID) private platformId: Object) {
        this.load();
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
            this.devicesModel.tabsintUUID =  "tabsintUUID";
            this.devicesModel.version = info.osVersion ?? 'Unknown';
            this.devicesModel.platform = info.platform ?? 'Unknown';
            this.devicesModel.model = info.model ?? 'Unknown';
            this.devicesModel.os = info.operatingSystem;
            this.devicesModel.other = `Battery level: ${batteryInfo.batteryLevel ?? 'Unknown'}, Language: ${languageCode.value ?? 'Unknown'}`;
            if (info.realDiskFree !== undefined) {
                this.devicesModel.diskspace = String(info.realDiskFree / (1024 * 1024));
            }
            this.logger.debug("Device info processed -- \n" + JSON.stringify((this.devicesModel)))
        } catch (error) {
            this.logger.debug("Device info not available");
        }
    }

    getDevices(): DevicesInterface {
        return this.devicesModel;
    }
}