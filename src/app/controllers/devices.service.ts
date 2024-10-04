import { Injectable } from '@angular/core';
import { Logger } from '../utilities/logger.service';
import { StateModel } from '../models/state/state.service';
import { StateInterface } from '../models/state/state.interface';
import { TympanService } from './devices/tympan.service';
import { ConnectedDevice, NewConnectedDevice } from '../interfaces/connected-device.interface';
import { DeviceUtil } from '../utilities/device-utility';
import { isTympanDevice } from '../guards/type.guard';
import { BleDevice } from '../interfaces/bluetooth.interface';
import { DeviceChooseComponent } from '../views/config/config-views/device-choose/device-choose.component';
import { MatDialog } from '@angular/material/dialog';
import { DevicesModel } from '../models/devices/devices.service';
import { DeviceResponse } from '../models/devices/devices.interface';

@Injectable({
    providedIn: 'root',
})

export class DeviceService {
    state: StateInterface;

    constructor(
        private readonly stateModel: StateModel,
        private readonly tympanService: TympanService,
        private readonly deviceUtil: DeviceUtil,
        private readonly logger: Logger,
        private readonly dialog: MatDialog,
        private readonly devicesModel: DevicesModel
    ) {
        this.state = this.stateModel.getState();
        this.devicesModel.deviceResponseSubject.subscribe( (deviceResponse:DeviceResponse) => {
            console.log("deviceResponse",deviceResponse);
            // TODO: Remove - this is for testing only
            setTimeout( async() => {
                let device = this.deviceUtil.getDeviceFromTabsintId(deviceResponse.tabsintId);
                if (device) {
                    await this.requestId(device);
                }
            }, 1000);
        });
    }

    /** Scan for new device connection
     * @summary Scan and connect to a new device
    */
    async scan(newConnectedDevice:NewConnectedDevice) {
        if (isTympanDevice(newConnectedDevice)) {
            await this.tympanService.startScan();
    
            this.dialog.open(DeviceChooseComponent).afterClosed().subscribe(
            async (tympan: BleDevice| undefined) => {
                if (tympan!=undefined) {
                    let connection = await this.tympanService.connect(tympan, newConnectedDevice);
                    if (connection) {
                        await this.requestId(connection);
                    }
                } else {
                    await this.tympanService.stopScan();
                }
            });
        } else {
            this.logger.error("Unsupported device type: "+JSON.stringify(newConnectedDevice.type));
        }
    }

    /** Disconnect from device
     * @summary Disconnect from device
    */
    async disconnect(device:ConnectedDevice) {
        if (isTympanDevice(device)) {
            await this.tympanService.disconnect(device.deviceId);
        } else {
            this.logger.error("Unsupported device type: "+JSON.stringify(device.type));
        }
    }

    /** Reconnect to device
     * @summary Reconnect to a previously connected device
    */
    async reconnect(device:ConnectedDevice) {
        if (isTympanDevice(device)) {
            let connection = await this.tympanService.reconnect(device.deviceId);
            if (connection) {
                await this.requestId(connection);
            }
        } else {
            this.logger.error("Unsupported device type: "+JSON.stringify(device.type));
        }
    }

    /** Remove device from TabSINT
     * @summary Removes device from connected device manager in TabSINT
    */
    async removeDevice(device:ConnectedDevice) {
        await this.disconnect(device);
        this.deviceUtil.removeDevice(device);
    }

    /** Requests device ID.
     * @summary Requests deviceID
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
            let msgId = device.msgId.toString();
            await this.tympanService.queueExam(device.deviceId,msgId,examType);
            this.deviceUtil.incrementDeviceMsgId(device);
        } else {
            this.logger.error("Unsupported device type: "+JSON.stringify(device.type));
        }
    }

    async examSubmission(device:ConnectedDevice,examProperties:Object) {
        if (isTympanDevice(device)) {
            let msgId = device.msgId.toString();
            await this.tympanService.examSubmission(device.deviceId,msgId,examProperties);
            this.deviceUtil.incrementDeviceMsgId(device);
        } else {
            this.logger.error("Unsupported device type: "+JSON.stringify(device.type));
        }
    }

    async abortExam(device:ConnectedDevice) {
        if (isTympanDevice(device)) {
            let msgId = device.msgId.toString();
            await this.tympanService.abortExam(device.deviceId,msgId);
            this.deviceUtil.incrementDeviceMsgId(device);
        } else {
            this.logger.error("Unsupported device type: "+JSON.stringify(device.type));
        }
    }

    async requestResults(device:ConnectedDevice) {
        if (isTympanDevice(device)) {
            let msgId = device.msgId.toString();
            await this.tympanService.requestResults(device.deviceId,msgId);
            this.deviceUtil.incrementDeviceMsgId(device);
        } else {
            this.logger.error("Unsupported device type: "+JSON.stringify(device.type));
        }
    }

}



