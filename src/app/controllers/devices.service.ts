import { Injectable } from '@angular/core';
import { Logger } from '../utilities/logger.service';
import { DevicesModel } from '../models/devices/devices.service';
import { DevicesInterface } from '../models/devices/devices.interface';
import { StateModel } from '../models/state/state.service';
import { StateInterface } from '../models/state/state.interface';
import { TympanService } from './devices/tympan.service';
import { ConnectedDevice } from '../interfaces/connected-device.interface';
import { DeviceUtil } from '../utilities/device-utility';
import { isTympanDevice } from '../guards/type.guard';

@Injectable({
    providedIn: 'root',
})

export class DeviceService {
    devices: DevicesInterface;
    state: StateInterface

    constructor(
        private devicesModel: DevicesModel,
        private stateModel: StateModel,
        private tympanService: TympanService,
        private deviceUtil: DeviceUtil,
        private logger: Logger
    ) {
        this.devices = this.devicesModel.getDevices();
        this.state = this.stateModel.getState();
    }

    /** Requests device ID.
     * @summary Requests deviceID
     * @models devices?
    */
    async requestId(device:ConnectedDevice) {
        if (isTympanDevice(device)) {
            let msgId = device.msgId.toString();
            await this.tympanService.requestId(device.deviceId,msgId);
            this.deviceUtil.incrementDeviceMsgId(device);
        } else {
            this.logger.error("Unsupported device type: "+JSON.stringify(device.type))
        }
    }

    /** Queues an exam.
     * @summary Starts an exam on the device
     * @models devices?
    */
    async queueExam(device:ConnectedDevice,examType:string) {
        if (isTympanDevice(device)) {

        } else {
            this.logger.error("Unsupported device type: "+JSON.stringify(device.type))
        }
    }

    async examSubmission(device:ConnectedDevice) {
        if (isTympanDevice(device)) {

        } else {
            this.logger.error("Unsupported device type: "+JSON.stringify(device.type))
        }
    }

    async requestResults(device:ConnectedDevice) {
        if (isTympanDevice(device)) {

        } else {
            this.logger.error("Unsupported device type: "+JSON.stringify(device.type))
        }
    }

}



