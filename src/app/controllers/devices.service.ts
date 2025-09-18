import { Injectable } from '@angular/core';
import { Logger } from '../utilities/logger.service';
import { DevicesModel } from '../models/devices/devices-model.service';
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
import { DeviceState, ExamState } from '../utilities/constants';
import { Subscription } from 'rxjs/internal/Subscription';

@Injectable({
    providedIn: 'root',
})

export class DevicesService {
    devices: DevicesInterface;
    state: StateInterface;
    stateSubscription: Subscription | undefined;

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
        this.stateSubscription = this.stateModel.stateSubject.subscribe( (updatedState) => {
        this.state = updatedState;
        });
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
                        this.devices.connectedDevices.tympan.push(connection);
                        await this.abortExams(connection);
                        await this.requestId(connection);
                        this.deviceUtil.updateDeviceState(connection.deviceId, DeviceState.Connected);
                        this.stateModel.updatePaneOpen({tympans: true});
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
                this.deviceUtil.updateDeviceState(device.deviceId, DeviceState.Connected);
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

    async deviceErrorHandler(resp: Array<any> | undefined, ignoreErrors: Array<string> = []) {
        if (resp && resp[1] === "ERROR") {
            if (ignoreErrors?.includes(resp[2])) {
                // ignore the error
            } else {
                this.stateModel.updateState({examState: ExamState.DeviceError});
                this.stateModel.updateState({deviceError: resp});
            }
        }
    }

    /**
     * Replicate the firmware response for when a device is not found.
     */
    async deviceNotFound() {
        const resp = [0, "ERROR", "Default device not found error. Make sure it is connected and try again."];
        await this.deviceErrorHandler(resp);
    }


    /** Requests device ID.
     * @summary Requests deviceID
    */
    async requestId(device: ConnectedDevice) {
        let resp;
        if (isTympanDevice(device)) {
            let msgId = device.msgId.toString();
            this.deviceUtil.incrementDeviceMsgId(device.deviceId);
            let resp = await this.tympanService.requestId(device.deviceId, msgId);
            this.logger.debug("requestId response: "+JSON.stringify(resp));
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
            this.deviceUtil.incrementDeviceMsgId(device.deviceId);  
            resp = await this.tympanService.queueExam(device.deviceId, msgId, examType, examProperties);
            this.logger.debug("queueExam response: "+JSON.stringify(resp));
        } else {
            this.logger.error("Unsupported device type: "+JSON.stringify(device.type));
        }

        await this.deviceErrorHandler(resp);
        return resp
    }

    async examSubmission(device: ConnectedDevice, examProperties: object, ignoreErrors: Array<string> = []) {
        let resp: Array<any> | undefined;
        if (isTympanDevice(device)) {
            let msgId = device.msgId.toString();
            this.deviceUtil.incrementDeviceMsgId(device.deviceId);
            resp = await this.tympanService.examSubmission(device.deviceId,msgId,examProperties);
            this.logger.debug("examSubmission response: "+JSON.stringify(resp));
        } else {
            this.logger.error("Unsupported device type: "+JSON.stringify(device.type));
        }

        // need to handle this but its inside of the examsubmission call...
        await this.deviceErrorHandler(resp, ignoreErrors);
        return resp
    }

    async abortExams(device: ConnectedDevice) {
        let resp: Array<any> | undefined;
        if (isTympanDevice(device)) {
            let msgId = device.msgId.toString();
            this.deviceUtil.incrementDeviceMsgId(device.deviceId);
            resp = await this.tympanService.abortExams(device.deviceId,msgId);
            this.logger.debug("abortExams response: "+JSON.stringify(resp));
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
            this.deviceUtil.incrementDeviceMsgId(device.deviceId);
            resp = await this.tympanService.requestResults(device.deviceId,msgId, timeoutTimeMs);
            this.logger.debug("requestResults response: "+JSON.stringify(resp));
        } else {
            this.logger.error("Unsupported device type: "+JSON.stringify(device.type));
        }

        await this.deviceErrorHandler(resp);
        return resp
    }

}
