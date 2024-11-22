import { Injectable } from '@angular/core';
import { Logger } from '../../utilities/logger.service';
import { TympanWrap } from '../../utilities/tympan-wrap.service';
import { BleDevice } from '../../interfaces/bluetooth.interface';
import { DevicesModel } from '../../models/devices/devices-model.service';
import { DevicesInterface, TympanResponse } from '../../models/devices/devices.interface';
import { DeviceState, ExamState } from '../../utilities/constants';
import { StateModel } from '../../models/state/state.service';
import { StateInterface } from '../../models/state/state.interface';
import { NewConnectedDevice, ConnectedDevice } from '../../interfaces/connected-device.interface';
import { DeviceUtil } from '../../utilities/device-utility';
import { Subscription } from "rxjs";

export interface PendingMsgInfo {
    tabsintId: number;
    msgId: string;
}

@Injectable({
    providedIn: 'root',
})

export class TympanService {
    devices: DevicesInterface;
    state: StateInterface;
    tympanSubscription: Subscription|undefined;
    pendingMsgInfo: PendingMsgInfo|null = null;
    pendingMsg: boolean = false;
    response: Array<any> = [];
    currentTimeoutTimeMs: number = 0;

    constructor(
        private readonly tympanWrap: TympanWrap, 
        private readonly devicesModel: DevicesModel,
        private readonly stateModel: StateModel,
        private readonly logger: Logger,
        private readonly deviceUtil: DeviceUtil
    ) {
        this.devices = this.devicesModel.getDevices();
        this.state = this.stateModel.getState();

        this.tympanSubscription = this.devicesModel.tympanResponseSubject.subscribe((response: TympanResponse) => {
            logger.debug("tympanService device msg: "+JSON.stringify(response));
            if (this.deviceUtil.checkTympanResponse(this.pendingMsgInfo, response)) {
                this.pendingMsgInfo = null;
                this.pendingMsg = false;
                this.response = JSON.parse(response.msg);
            }
        });
    }

    startMsgTracking(tabsintId: number, msgId: string) {
        this.pendingMsgInfo = {
            tabsintId: tabsintId,
            msgId: msgId
        };
        this.pendingMsg = true;
        this.response = [];
        this.currentTimeoutTimeMs = 0;
    }

    async waitForResponse(timeoutTimeMs: number = 10000, timeoutPollingDelayMs: number = 10) {
        while (this.pendingMsg) {
            await this.delay(timeoutPollingDelayMs);
            this.currentTimeoutTimeMs += timeoutPollingDelayMs;
            if (this.currentTimeoutTimeMs >= timeoutTimeMs) {
                this.pendingMsg = false;
            }
        }
    }

    delay(ms: number) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    onDisconnect(deviceId: string): void {
        this.logger.debug(`device ${deviceId} disconnected`);
        this.deviceUtil.updateDeviceState(deviceId, DeviceState.Disconnected);
    }

    async startScan() {
        let timeout = 10000;
        await this.tympanWrap.startScanning(this.devicesModel.availableDevicesSubject, timeout);
    }

    async stopScan() {
        await this.tympanWrap.stopScanning();
    }

    async connect(tympan: BleDevice, newConnectedDevice: NewConnectedDevice): Promise<ConnectedDevice|undefined> {
        await this.tympanWrap.stopScanning();
            
        this.logger.debug("attempting to connect to tympan : " + JSON.stringify(tympan));
        try {
            await this.tympanWrap.connect(tympan.deviceId, this.onDisconnect.bind(this));

            let newConnection = newConnectedDevice;
            newConnection["deviceId"] = tympan.deviceId;
            newConnection["name"] = tympan.name;

            let connection: ConnectedDevice = this.deviceUtil.createDeviceConnection(newConnection);
            this.devices.connectedDevices.tympan.push(connection);
            this.state.isPaneOpen.tympans = true;
            return connection;
        } catch {
            this.logger.error("failed to connect to tympan: "+JSON.stringify(tympan));
            return undefined;
        }      
    }

    async reconnect(tympanId: string): Promise<ConnectedDevice|undefined> {
        try {
            await this.tympanWrap.connect(tympanId, this.onDisconnect.bind(this));
            this.deviceUtil.updateDeviceState(tympanId, DeviceState.Connected);
            return this.deviceUtil.getDeviceFromDeviceId(tympanId);
        } catch {
            this.logger.error("failed to reconnect to tympan: "+JSON.stringify(tympanId));
            return undefined
        }
    }

    async disconnect(tympanId: string) {
        await this.tympanWrap.disconnect(tympanId);
        this.deviceUtil.updateDeviceState(tympanId, DeviceState.Disconnected);
    }

    async requestId(tympanId: string, msgId: string): Promise<Array<any>> {
        let resp: Array<any> = [-msgId,"ERROR"];
        let msg = '['+msgId+',"requestId"]';
        try {
            this.startMsgTracking(1, msgId);
            await this.tympanWrap.write(tympanId, msg);
            await this.waitForResponse();
            resp = this.response.length === 0 ? [-msgId,"ERROR","timeout"] : this.response;
        } catch (e) {
            this.state.examState = ExamState.DeviceError;
            this.state.deviceError = resp;
            this.logger.error("failed to write to tympan with msg: "+JSON.stringify(msg)+" , error: "+JSON.stringify(e));
        }
        return resp
    }

    async queueExam(tympanId: string, msgId: string, examType: string, examProperties: object): Promise<Array<any>> {
        let resp: Array<any> = [-msgId,"ERROR"];
        let examId: string = "1";
        let msg = '['+msgId+',"queueExam",'+examId+',"'+examType+'",'+JSON.stringify(examProperties)+']';
        try {
            this.startMsgTracking(1, msgId);
            await this.tympanWrap.write(tympanId, msg);
            await this.waitForResponse();
            resp = this.response.length === 0 ? [-msgId,"ERROR","timeout"] : this.response;
        } catch (e) {
            this.state.examState = ExamState.DeviceError;
            this.logger.error("failed to write to tympan with msg: "+JSON.stringify(msg)+" , error: "+JSON.stringify(e));
        }
        return resp
    }

    async examSubmission(tympanId: string, msgId: string, examProperties: object): Promise<Array<any>> {
        let resp: Array<any> = [-msgId,"ERROR"];
        let examId: string = "1";
        let msg = '['+msgId+',"examSubmission",'+examId+','+JSON.stringify(examProperties)+']';
        try {
            this.startMsgTracking(1, msgId);
            await this.tympanWrap.write(tympanId, msg);
            await this.waitForResponse();
            resp = this.response.length === 0 ? [-msgId,"ERROR","timeout"] : this.response;
        } catch (e) {
            this.state.examState = ExamState.DeviceError;
            this.logger.error("failed to write to tympan with msg: "+JSON.stringify(msg)+" , error: "+JSON.stringify(e));
        }
        return resp
    }

    async abortExams(tympanId: string, msgId: string): Promise<Array<any>> {
        // This aborts ALL running exams
        let resp: Array<any> = [-msgId,"ERROR"];
        let msg = '['+msgId+',"abortExams"]';
        try {
            this.startMsgTracking(1, msgId);
            await this.tympanWrap.write(tympanId, msg);
            await this.waitForResponse();
            resp = this.response.length === 0 ? [-msgId,"ERROR","timeout"] : this.response;
        } catch (e) {
            this.state.examState = ExamState.DeviceError;
            this.logger.error("failed to write to tympan with msg: "+JSON.stringify(msg)+" , error: "+JSON.stringify(e));
        }
        return resp
    }

    async requestResults(tympanId: string, msgId: string): Promise<Array<any>> {
        let resp: Array<any> = [-msgId,"ERROR"];
        let examId: string = "1";
        let msg = '['+msgId+',"requestResults",'+examId+']';
        try {
            this.startMsgTracking(1, msgId);
            await this.tympanWrap.write(tympanId, msg);
            await this.waitForResponse();
            resp = this.response.length === 0 ? [-msgId,"ERROR","timeout"] : this.response;
        } catch (e) {
            this.state.examState = ExamState.DeviceError;
            this.logger.error("failed to write to tympan with msg: "+JSON.stringify(msg)+" , error: "+JSON.stringify(e));
        }
        return resp
    }

}



