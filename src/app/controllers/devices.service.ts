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
import { ExamState } from '../utilities/constants';

@Injectable({
    providedIn: 'root',
})

export class DevicesService {
    state: StateInterface;

    constructor(
        private readonly stateModel: StateModel,
        private readonly tympanService: TympanService,
        private readonly deviceUtil: DeviceUtil,
        private readonly logger: Logger,
        private readonly dialog: MatDialog
    ) {
        this.state = this.stateModel.getState();
    }

    /** Scan for new device connection
     * @summary Scan and connect to a new device
    */
    async scan(newConnectedDevice: NewConnectedDevice) {
        if (isTympanDevice(newConnectedDevice)) {
            await this.tympanService.startScan();
    
            this.dialog.open(DeviceChooseComponent).afterClosed().subscribe(
            async (tympan: BleDevice|undefined) => {
                if (tympan!=undefined) {
                    let connection = await this.tympanService.connect(tympan, newConnectedDevice);
                    if (connection) {
                        this.deviceUtil.addNewSavedDevice(connection);
                        await this.abortExams(connection);
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
    async disconnect(device: ConnectedDevice) {
        if (isTympanDevice(device)) {
            await this.tympanService.disconnect(device.deviceId);
        } else {
            this.logger.error("Unsupported device type: "+JSON.stringify(device.type));
        }
    }

    /** Reconnect to device
     * @summary Reconnect to a previously connected device
    */
    async reconnect(device: ConnectedDevice) {
        if (isTympanDevice(device)) {
            let connection = await this.tympanService.reconnect(device.deviceId);
            if (connection) {
                await this.abortExams(connection);
                await this.requestId(connection);
            }
        } else {
            this.logger.error("Unsupported device type: "+JSON.stringify(device.type));
        }
    }

    /** Remove device from TabSINT
     * @summary Removes device from connected device manager in TabSINT
    */
    async removeDevice(device: ConnectedDevice) {
        await this.disconnect(device);
        this.deviceUtil.removeDevice(device);
    }

    async deviceErrorHandler(resp: Array<any> | undefined) {
        if (resp && resp[1] === "ERROR") {
            this.state.examState = ExamState.DeviceError;
            this.state.deviceError = resp;
        }
    }

    /** Requests device ID.
     * @summary Requests deviceID
    */
    async requestId(device: ConnectedDevice) {
        let resp;
        if (isTympanDevice(device)) {
            let msgId = device.msgId.toString();
            let resp = await this.tympanService.requestId(device.deviceId, msgId);
            this.logger.debug("requestId response: "+JSON.stringify(resp));
            this.deviceUtil.incrementDeviceMsgId(device.deviceId);
            let tabsintId = this.deviceUtil.getTabsintIdFromDeviceId(device.deviceId);
            this.deviceUtil.updateDeviceInfo(tabsintId!,resp[1]);
        }
        return resp
    }

    /** Queues an exam.
     * @summary Starts an exam on the device
     * @models devices?
    */
    async queueExam(device: ConnectedDevice, examType: string, examProperties: object) {
        // these functions dont need responses (remove if not needed)
        let resp: Array<any> | undefined;
        if (isTympanDevice(device)) {
            let msgId = device.msgId.toString();
            resp = await this.tympanService.queueExam(device.deviceId, msgId, examType, examProperties);
            this.logger.debug("queueExam response: "+JSON.stringify(resp));
            this.deviceUtil.incrementDeviceMsgId(device.deviceId);  
        } else {
            this.logger.error("Unsupported device type: "+JSON.stringify(device.type));
        }

        await this.deviceErrorHandler(resp);
        return resp
    }

    async examSubmission(device: ConnectedDevice, examProperties: object) {
        let resp: Array<any> | undefined;
        if (isTympanDevice(device)) {
            let msgId = device.msgId.toString();
            resp = await this.tympanService.examSubmission(device.deviceId,msgId,examProperties);
            this.logger.debug("examSubmission response: "+JSON.stringify(resp));
            this.deviceUtil.incrementDeviceMsgId(device.deviceId);
        } else {
            this.logger.error("Unsupported device type: "+JSON.stringify(device.type));
        }

        await this.deviceErrorHandler(resp);
        return resp
    }

    async abortExams(device: ConnectedDevice) {
        let resp: Array<any> | undefined;
        if (isTympanDevice(device)) {
            let msgId = device.msgId.toString();
            resp = await this.tympanService.abortExams(device.deviceId,msgId);
            this.logger.debug("abortExams response: "+JSON.stringify(resp));
            this.deviceUtil.incrementDeviceMsgId(device.deviceId);
        } else {
            this.logger.error("Unsupported device type: "+JSON.stringify(device.type));
        }

        await this.deviceErrorHandler(resp);
        return resp
    }

    async requestResults(device: ConnectedDevice, timeoutTimeMs: number = 5000) {
        let resp: Array<any> | undefined;
        if (isTympanDevice(device)) {
            let msgId = device.msgId.toString();
            resp = await this.tympanService.requestResults(device.deviceId,msgId, timeoutTimeMs);
            this.logger.debug("requestResults response: "+JSON.stringify(resp));
            this.deviceUtil.incrementDeviceMsgId(device.deviceId);
        } else {
            this.logger.error("Unsupported device type: "+JSON.stringify(device.type));
        }

        await this.deviceErrorHandler(resp);
        return resp
    }

}



