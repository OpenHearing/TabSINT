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
import { PendingMsgInfo } from '../../interfaces/pending-msg-info.interface';
import { Command } from '../../types/custom-types';

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
    currentCommand: Command<Array<any>> | null = null;
    defaultErrorMsg = ["ERROR", "Failed to write message to tympan. Make sure Tympan in connected and try again."];
    defaultTimeoutTimeMs = 5000;

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
            if (this.deviceUtil.isResponseInvalidChecksum(response)) {
                this.retryTympanCommand();
            } else if (this.deviceUtil.doTympanResponseMsgIdsMatch(this.pendingMsgInfo, response)) {
                this.pendingMsg = false;
                this.response = JSON.parse(response.msg);
            }
        });
    }


    startTracking(tabsintId: number, msgId: string, command: Command<Array<any>>) {
        this.pendingMsgInfo = {
            tabsintId: tabsintId,
            msgId: msgId
        };
        this.pendingMsg = true;
        this.response = [];
        this.currentTimeoutTimeMs = 0;
        this.currentCommand = command;
    }

    async waitForResponse(timeoutTimeMs: number = this.defaultTimeoutTimeMs, timeoutPollingDelayMs: number = 100) {
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
        let resp: Array<any> = [-msgId].concat(JSON.parse(JSON.stringify(this.defaultErrorMsg)));
        let msg = '['+msgId+',"requestId"]';
        this.currentCommand = {
            func: this.requestId.bind(this),
            params: [tympanId, msgId]
        };
        try {
            this.startTracking(1, msgId, this.currentCommand);
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
        let resp: Array<any> = [-msgId].concat(JSON.parse(JSON.stringify(this.defaultErrorMsg)));
        let examId: string = "1";
        let msg = '['+msgId+',"queueExam",'+examId+',"'+examType+'",'+JSON.stringify(examProperties)+']';
        this.currentCommand = {
            func: this.queueExam.bind(this),
            params: [tympanId, msgId, examType, examProperties]
        };
        try {
            this.startTracking(1, msgId, this.currentCommand);
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
        let resp: Array<any> = [-msgId].concat(JSON.parse(JSON.stringify(this.defaultErrorMsg)));
        let examId: string = "1";
        let msg = '['+msgId+',"examSubmission",'+examId+','+JSON.stringify(examProperties)+']';
        this.currentCommand = {
            func: this.examSubmission.bind(this),
            params: [tympanId, msgId, examProperties]
        };
        try {
            this.startTracking(1, msgId, this.currentCommand);
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
        let resp: Array<any> = [-msgId].concat(JSON.parse(JSON.stringify(this.defaultErrorMsg)));
        let msg = '['+msgId+',"abortExams"]';
        this.currentCommand = {
            func: this.abortExams.bind(this),
            params: [tympanId, msgId]
        };
        try {
            this.startTracking(1, msgId, this.currentCommand);
            await this.tympanWrap.write(tympanId, msg);
            await this.waitForResponse();
            resp = this.response.length === 0 ? [-msgId,"ERROR","timeout"] : this.response;
        } catch (e) {
            this.state.examState = ExamState.DeviceError;
            this.logger.error("failed to write to tympan with msg: "+JSON.stringify(msg)+" , error: "+JSON.stringify(e));
        }
        return resp
    }

    async requestResults(tympanId: string, msgId: string, timeoutTimeMs: number = this.defaultTimeoutTimeMs): Promise<Array<any>> {
        let resp: Array<any> = [-msgId].concat(JSON.parse(JSON.stringify(this.defaultErrorMsg)));
        let examId: string = "1";
        let msg = '['+msgId+',"requestResults",'+examId+']';
        this.currentCommand = {
            func: this.requestResults.bind(this),
            params: [tympanId, msgId, timeoutTimeMs]
        };
        try {
            this.startTracking(1, msgId, this.currentCommand);
            await this.tympanWrap.write(tympanId, msg);
            await this.waitForResponse(timeoutTimeMs);
            resp = this.response.length === 0 ? [-msgId,"ERROR","timeout"] : this.response;
        } catch (e) {
            this.state.examState = ExamState.DeviceError;
            this.logger.error("failed to write to tympan with msg: "+JSON.stringify(msg)+" , error: "+JSON.stringify(e));
        }
        return resp
    }

    private async retryTympanCommand() {
        this.logger.debug("retrying command " + String(this.currentCommand?.func));
        await this.currentCommand?.func(...this.currentCommand.params);
    }
}



