import { Injectable } from '@angular/core';
import { Logger } from '../utilities/logger.service';
import { DevicesModel } from '../models/devices/devices.service';
import { DevicesInterface } from '../models/devices/devices.interface';
import { StateModel } from '../models/state/state.service';
import { StateInterface } from '../models/state/state.interface';
import { TympanService } from './devices/tympan.service';
import { ConnectedDevice, NewConnectedDevice } from '../interfaces/connected-device.interface';
import { DeviceUtil } from '../utilities/device-utility';
import { isTympanDevice } from '../guards/type.guard';
import { BleDevice } from '../interfaces/bluetooth.interface';
import { DeviceChooseComponent } from '../views/config/config-views/device-choose/device-choose.component';
import { MatDialog } from '@angular/material/dialog';


@Injectable({
    providedIn: 'root',
})

export class DeviceService {
    devices: DevicesInterface;
    state: StateInterface

    constructor(
        private readonly devicesModel: DevicesModel,
        private readonly stateModel: StateModel,
        private readonly tympanService: TympanService,
        private readonly deviceUtil: DeviceUtil,
        private readonly logger: Logger,
        private readonly dialog: MatDialog
    ) {
        this.devices = this.devicesModel.getDevices();
        this.state = this.stateModel.getState();
    }

    /** Scan for new device connection
     * @summary Scan and connect to a new device
     * @models ???
    */
    async scan(newConnectedDevice:NewConnectedDevice) {
        if (isTympanDevice(newConnectedDevice)) {
            await this.tympanService.startScan();
    
            this.dialog.open(DeviceChooseComponent).afterClosed().subscribe(
            async (tympan: BleDevice| undefined) => {
                if (tympan!=undefined) {
                    // TODO: Do we really need to pass newConnectedDevice to the tympanService?
                    await this.tympanService.connect(tympan, newConnectedDevice);
                } else {
                    await this.tympanService.stopScan();
                }
            });
        } else {
            this.logger.error("Unsupported device type: "+JSON.stringify(newConnectedDevice.type));
        }
    }

    /** aaa
     * @summary bbb
     * @models ccc
    */
    async connect(device:ConnectedDevice) {
        if (isTympanDevice(device)) {
            let msgId = device.msgId.toString();
            await this.tympanService.requestId(device.deviceId,msgId);
            this.deviceUtil.incrementDeviceMsgId(device);
        } else {
            this.logger.error("Unsupported device type: "+JSON.stringify(device.type));
        }
    }

    /** aaa
     * @summary bbb
     * @models ccc
    */
    async disconnect(device:ConnectedDevice) {
        if (isTympanDevice(device)) {
            await this.tympanService.disconnect(device.deviceId);
        } else {
            this.logger.error("Unsupported device type: "+JSON.stringify(device.type));
        }
    }

    /** aaa
     * @summary bbb
     * @models ccc
    */
    async reconnect(device:ConnectedDevice) {
        if (isTympanDevice(device)) {
            this.tympanService.reconnect(device.deviceId);
        } else {
            this.logger.error("Unsupported device type: "+JSON.stringify(device.type));
        }
    }

    /** aaa
     * @summary bbb
     * @models ccc
    */
    async removeDevice(device:ConnectedDevice) {
        await this.disconnect(device);
        this.deviceUtil.removeDevice(device);
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
            this.logger.error("Unsupported device type: "+JSON.stringify(device.type));
        }
    }

    /** Queues an exam.
     * @summary Starts an exam on the device
     * @models devices?
    */
    async queueExam(device:ConnectedDevice,examType:string) {
        if (isTympanDevice(device)) {

        } else {
            this.logger.error("Unsupported device type: "+JSON.stringify(device.type));
        }
    }

    async examSubmission(device:ConnectedDevice) {
        if (isTympanDevice(device)) {

        } else {
            this.logger.error("Unsupported device type: "+JSON.stringify(device.type));
        }
    }

    async requestResults(device:ConnectedDevice) {
        if (isTympanDevice(device)) {

        } else {
            this.logger.error("Unsupported device type: "+JSON.stringify(device.type));
        }
    }

}



