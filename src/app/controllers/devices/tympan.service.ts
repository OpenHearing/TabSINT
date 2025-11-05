import { Injectable } from '@angular/core';
import { Logger } from '../../services/logger.service';
import { TympanWrap } from '../../services/tympan-wrap.service';
import { BleDevice } from '../../interfaces/bluetooth.interface';
import { DevicesModel } from '../../models/devices/devices-model.service';
import { DevicesInterface, TympanResponse } from '../../models/devices/devices.interface';
import { DeviceState, ExamState } from '../../utilities/constants';
import { StateModel } from '../../models/state/state.service';
import { StateInterface } from '../../models/state/state.interface';
import { NewConnectedDevice, ConnectedDevice } from '../../interfaces/connected-device.interface';
import { DeviceUtil } from '../../services/device-utility.service';
import { Subscription } from 'rxjs';
import { PendingMsgInfo } from '../../interfaces/pending-msg-info.interface';
import { Command } from '../../types/custom-types';

@Injectable({
  providedIn: 'root',
})
export class TympanService {
  devices: DevicesInterface;
  state: StateInterface;
  pendingMsgInfo: PendingMsgInfo | null = null;
  firstByteReceived: boolean = false;
  response: Array<any> = [];
  currentTimeoutTimeMs: number = 0;
  currentCommand: Command<Array<any>> | null = null;
  defaultErrorMsg = ['ERROR', 'Failed to write message to tympan. Make sure Tympan is connected and try again.'];
  defaultTimeoutTimeMs = 3000;
  trackedDeviceId: string | undefined;

  tympanSubscription: Subscription | undefined;
  firstByteSubscription: Subscription | undefined;
  stateSubscription: Subscription | undefined;

  constructor(
    private readonly tympanWrap: TympanWrap,
    private readonly devicesModel: DevicesModel,
    private readonly stateModel: StateModel,
    private readonly logger: Logger,
    private readonly deviceUtil: DeviceUtil
  ) {
    this.devices = this.devicesModel.getDevices();
    this.state = this.stateModel.getState();
    this.stateSubscription = this.stateModel.stateSubject.subscribe(updatedState => {
      this.state = updatedState;
    });

    this.tympanSubscription = this.devicesModel.tympanResponseSubject.subscribe((response: TympanResponse) => {
      if (this.deviceUtil.isResponseInvalidChecksum(response)) {
        this.retryTympanCommand();
      } else if (this.deviceUtil.doTympanResponseMsgIdsMatch(this.pendingMsgInfo, response)) {
        this.response = JSON.parse(response.msg);
        this.stopTracking();
      }
    });
    this.firstByteSubscription = this.devicesModel.firstByteHandlerSubject.subscribe((response: any) => {
      // Eventually should check the msg ID to extend to multiple tympans
      this.firstByteReceived = true;
    });
  }

  startTracking(deviceId: string, msgId: string, command: Command<Array<any>>) {
    let tabsintId: string | undefined = this.deviceUtil.getTabsintIdFromDeviceId(deviceId);
    this.pendingMsgInfo = {
      tabsintId: Number(tabsintId!),
      msgId: msgId,
    };
    this.trackedDeviceId = deviceId;
    this.setMessagePending(this.trackedDeviceId, true);
    this.firstByteReceived = false;
    this.response = [];
    this.currentTimeoutTimeMs = 0;
    this.currentCommand = command;
  }

  /**
   * Stop the current pending message from being tracked.
   */
  private stopTracking() {
    this.setMessagePending(this.trackedDeviceId, false);
    this.trackedDeviceId = undefined;
  }

  /**
   * Set the state of message pending for a specific device.
   * @param deviceId The device to set the state for.
   * @param isPending Whether a message is pending or not.
   */
  private setMessagePending(deviceId: string | undefined, isPending: boolean) {
    const device = this.devices.connectedDevices.tympan.find(value => value.deviceId === deviceId);
    if (device) {
      device.isMsgPending = isPending;
    }
  }

  /**
   * Get whether a message is pending for a specific device
   * @param deviceId The device to get the state for.
   * @returns isPending Whether a message is pending or not.
   */
  private getMessagePending(deviceId: string | undefined): boolean {
    const device = this.devices.connectedDevices.tympan.find(value => value.deviceId === deviceId);
    return device?.isMsgPending ?? false;
  }

  async waitForResponse(timeoutTimeMs: number = this.defaultTimeoutTimeMs, timeoutPollingDelayMs: number = 100) {
    while (this.getMessagePending(this.trackedDeviceId)) {
      await this.delay(timeoutPollingDelayMs);
      this.currentTimeoutTimeMs += timeoutPollingDelayMs;
      if (this.firstByteReceived === false && this.currentTimeoutTimeMs >= timeoutTimeMs) {
        this.stopTracking();
      }
    }
  }

  delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  onDisconnect(deviceId: string): void {
    this.logger.debug(`device ${deviceId} disconnected`);
    this.deviceUtil.updateDeviceState(deviceId, DeviceState.Disconnected);
    this.stateModel.updatePaneOpen({ tympans: true });
  }

  async startScan() {
    let timeout = 10000;
    await this.tympanWrap.startScanning(this.devicesModel.availableDevicesSubject, timeout);
  }

  async stopScan() {
    await this.tympanWrap.stopScanning();
  }

  async connect(tympan: BleDevice, newConnectedDevice: NewConnectedDevice): Promise<ConnectedDevice | undefined> {
    await this.tympanWrap.stopScanning();

    this.logger.debug('attempting to connect to tympan : ' + JSON.stringify(tympan));
    try {
      await this.tympanWrap.connect(tympan.deviceId, this.onDisconnect.bind(this));

      let newConnection = newConnectedDevice;
      newConnection['deviceId'] = tympan.deviceId;
      newConnection['name'] = tympan.name;

      let maxByteLength = await this.tympanWrap.getMaxByteLength(tympan.deviceId);
      newConnection['maxByteLength'] = maxByteLength - 3; // max byte length is MTU -3

      let connection: ConnectedDevice = this.deviceUtil.createDeviceConnection(newConnection);
      connection.state = DeviceState.Disconnected;
      return connection;
    } catch {
      this.logger.error('failed to connect to tympan: ' + JSON.stringify(tympan));
      return undefined;
    }
  }

  async reconnect(tympanId: string): Promise<ConnectedDevice | undefined> {
    try {
      await this.tympanWrap.connect(tympanId, this.onDisconnect.bind(this));
      return this.deviceUtil.getDeviceFromDeviceId(tympanId);
    } catch {
      this.logger.error('failed to reconnect to tympan: ' + JSON.stringify(tympanId));
      return undefined;
    }
  }

  async disconnect(tympanId: string) {
    await this.tympanWrap.disconnect(tympanId);
    this.deviceUtil.updateDeviceState(tympanId, DeviceState.Disconnected);
  }

  async requestId(tympanId: string, msgId: string): Promise<Array<any>> {
    let resp: Array<any> = [-msgId].concat(JSON.parse(JSON.stringify(this.defaultErrorMsg)));
    let msg = '[' + msgId + ',"requestId"]';
    this.currentCommand = {
      func: this.requestId.bind(this),
      params: [tympanId, msgId],
    };
    try {
      this.startTracking(tympanId, msgId, this.currentCommand);
      let maxByteLength = this.deviceUtil.getMaxByteLengthFromDeviceId(tympanId);
      await this.tympanWrap.write(tympanId, msg, maxByteLength);
      await this.waitForResponse();
      resp = this.handleTimeoutErrors(msgId);
    } catch (e) {
      this.stateModel.updateState({
        examState: ExamState.DeviceError,
        deviceError: resp,
      });
      this.logger.error('failed to write to tympan with msg: ' + JSON.stringify(msg) + ' , error: ' + JSON.stringify(e));
      this.stopTracking();
    }
    return resp;
  }

  async queueExam(tympanId: string, msgId: string, examType: string, examProperties: object): Promise<Array<any>> {
    let resp: Array<any> = [-msgId].concat(JSON.parse(JSON.stringify(this.defaultErrorMsg)));
    let examId: string = '1';
    let msg = '[' + msgId + ',"queueExam",' + examId + ',"' + examType + '",' + JSON.stringify(examProperties) + ']';
    this.currentCommand = {
      func: this.queueExam.bind(this),
      params: [tympanId, msgId, examType, examProperties],
    };
    try {
      this.startTracking(tympanId, msgId, this.currentCommand);
      let maxByteLength = this.deviceUtil.getMaxByteLengthFromDeviceId(tympanId);
      await this.tympanWrap.write(tympanId, msg, maxByteLength);
      await this.waitForResponse();
      resp = this.handleTimeoutErrors(msgId);
    } catch (e) {
      this.stateModel.updateState({ examState: ExamState.DeviceError });
      this.logger.error('failed to write to tympan with msg: ' + JSON.stringify(msg) + ' , error: ' + JSON.stringify(e));
      this.stopTracking();
    }
    return resp;
  }

  async examSubmission(tympanId: string, msgId: string, examProperties: object): Promise<Array<any>> {
    let resp: Array<any> = [-msgId].concat(JSON.parse(JSON.stringify(this.defaultErrorMsg)));
    let examId: string = '1';
    let msg = '[' + msgId + ',"examSubmission",' + examId + ',' + JSON.stringify(examProperties) + ']';
    this.currentCommand = {
      func: this.examSubmission.bind(this),
      params: [tympanId, msgId, examProperties],
    };
    try {
      this.startTracking(tympanId, msgId, this.currentCommand);
      let maxByteLength = this.deviceUtil.getMaxByteLengthFromDeviceId(tympanId);
      await this.tympanWrap.write(tympanId, msg, maxByteLength);
      await this.waitForResponse();
      resp = this.handleTimeoutErrors(msgId);
    } catch (error: unknown) {
      this.stateModel.updateState({ examState: ExamState.DeviceError });
      if (error instanceof Error) {
        this.logger.error('failed to write to tympan with msg: ' + JSON.stringify(msg) + ' , error: ' + JSON.stringify(error.message));
      } else {
        this.logger.error('failed to write to tympan with msg: ' + JSON.stringify(msg) + ' , error: ' + JSON.stringify(error));
      }
      this.stopTracking();
    }
    return resp;
  }

  async abortExams(tympanId: string, msgId: string): Promise<Array<any>> {
    let resp: Array<any> = [-msgId].concat(JSON.parse(JSON.stringify(this.defaultErrorMsg)));
    let msg = '[' + msgId + ',"abortExams"]';
    this.currentCommand = {
      func: this.abortExams.bind(this),
      params: [tympanId, msgId],
    };
    try {
      this.startTracking(tympanId, msgId, this.currentCommand);
      let maxByteLength = this.deviceUtil.getMaxByteLengthFromDeviceId(tympanId);
      await this.tympanWrap.write(tympanId, msg, maxByteLength);
      await this.waitForResponse();
      resp = this.handleTimeoutErrors(msgId);
    } catch (e) {
      this.stateModel.updateState({ examState: ExamState.DeviceError });
      this.logger.error('failed to write to tympan with msg: ' + JSON.stringify(msg) + ' , error: ' + JSON.stringify(e));
      this.stopTracking();
    }
    return resp;
  }

  async requestResults(tympanId: string, msgId: string, timeoutTimeMs: number = this.defaultTimeoutTimeMs): Promise<Array<any>> {
    let resp: Array<any> = [-msgId].concat(JSON.parse(JSON.stringify(this.defaultErrorMsg)));
    let examId: string = '1';
    let msg = '[' + msgId + ',"requestResults",' + examId + ']';
    this.currentCommand = {
      func: this.requestResults.bind(this),
      params: [tympanId, msgId, timeoutTimeMs],
    };
    try {
      this.startTracking(tympanId, msgId, this.currentCommand);
      let maxByteLength = this.deviceUtil.getMaxByteLengthFromDeviceId(tympanId);
      await this.tympanWrap.write(tympanId, msg, maxByteLength);
      await this.waitForResponse(timeoutTimeMs);
      resp = this.handleTimeoutErrors(msgId);
    } catch (e) {
      this.stateModel.updateState({ examState: ExamState.DeviceError });
      this.logger.error('failed to write to tympan with msg: ' + JSON.stringify(msg) + ' , error: ' + JSON.stringify(e));
      this.stopTracking();
    }
    return resp;
  }

  private async retryTympanCommand() {
    this.logger.error('INVALID CHECKSUM in Tympan Service');
    this.logger.error('RETRYING COMMAND ' + String(this.currentCommand?.func));
    await this.currentCommand?.func(...this.currentCommand.params);
  }

  private handleTimeoutErrors(msgId: string) {
    let resp;
    if (this.response.length === 0) {
      resp = [-msgId, 'ERROR', 'timeout'];
    } else if (JSON.stringify(this.response).includes('byte timeout')) {
      resp = [-msgId, 'ERROR', 'byte timeout'];
    } else {
      resp = this.response;
    }
    return resp;
  }
}
