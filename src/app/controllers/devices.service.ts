import { Injectable } from '@angular/core';
import { Logger } from '../services/logger.service';
import { DevicesModel } from '../models/devices/devices-model.service';
import { DevicesInterface } from '../models/devices/devices.interface';
import { StateModel } from '../models/state/state.service';
import { StateInterface } from '../models/state/state.interface';
import { TympanService } from './devices/tympan.service';
import { ConnectedDevice, NewConnectedDevice } from '../interfaces/connected-device.interface';
import { DeviceUtil } from '../services/device-utility.service';
import { isTympanDevice } from '../guards/type.guard';
import { BleDevice } from '../interfaces/bluetooth.interface';
import { DeviceChooseComponent } from '../views/config/config-views/device-choose/device-choose.component';
import { MatDialog } from '@angular/material/dialog';
import { DeviceState, ExamState, DialogType } from '../utilities/constants';
import { Subscription } from 'rxjs/internal/Subscription';
import { Tasks } from '../services/tasks.service';
import { Notifications } from '../services/notifications.service';

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
    private readonly dialog: MatDialog,
    private readonly tasks: Tasks,
    private readonly notifications: Notifications
  ) {
    this.devices = this.devicesModel.getDevices();
    this.state = this.stateModel.getState();
    this.stateSubscription = this.stateModel.stateSubject.subscribe(updatedState => {
      this.state = updatedState;
    });
  }

  /** Scan for new device connection
   * @summary Scan and connect to a new device
   */
  async scan(newConnectedDevice: NewConnectedDevice) {
    if (isTympanDevice(newConnectedDevice)) {
      await this.tympanService.startScan();

      this.dialog
        .open(DeviceChooseComponent)
        .afterClosed()
        .subscribe(async (tympan: BleDevice | undefined) => {
          if (tympan != undefined) {
            this.tasks.register('Connect Device', `Connecting to Device... `);
            const connection = await this.tympanService.connect(tympan, newConnectedDevice);
            if (connection) {
              this.deviceUtil.addNewSavedDevice(connection);
              this.devices.connectedDevices.tympan.push(connection);
              await this.abortExams(connection);
              const resp = await this.requestId(connection);
              if (resp && !resp.includes('ERROR')) {
                this.deviceUtil.updateDeviceState(connection.deviceId, DeviceState.Connected);
                this.stateModel.updatePaneOpen({ tympans: true });
              } else {
                await this.disconnect(connection);
              }
              this.tasks.deregister('Connect Device');
            }
          } else {
            await this.tympanService.stopScan();
          }
        });
    } else {
      this.logger.error('Unsupported device type: ' + JSON.stringify(newConnectedDevice.type));
    }
  }

  /** Disconnect from device
   * @summary Disconnect from device
   */
  async disconnect(device: ConnectedDevice) {
    if (isTympanDevice(device)) {
      await this.tympanService.disconnect(device.deviceId);
    } else {
      this.logger.error('Unsupported device type: ' + JSON.stringify(device.type));
    }
  }

  /** Reconnect to device
   * @summary Reconnect to a previously connected device
   */
  async reconnect(device: ConnectedDevice) {
    if (isTympanDevice(device)) {
      this.tasks.register('Reconnect Device', 'Reconnect Device');
      const connection = await this.tympanService.reconnect(device.deviceId);
      if (connection) {
        await this.abortExams(connection);
        const resp = await this.requestId(connection);
        if (resp && !resp.includes('ERROR')) {
          this.deviceUtil.updateDeviceState(connection.deviceId, DeviceState.Connected);
          this.stateModel.updatePaneOpen({ tympans: true });
        } else {
          await this.disconnect(device);
        }
        this.tasks.deregister('Reconnect Device');
      }
      this.tasks.deregister('Reconnect Device');
    } else {
      this.logger.error('Unsupported device type: ' + JSON.stringify(device.type));
    }
  }

  /** Remove device from TabSINT
   * @summary Removes device from connected device manager in TabSINT
   */
  async removeDevice(device: ConnectedDevice) {
    await this.disconnect(device);
    this.deviceUtil.removeDevice(device);
  }

  async deviceErrorHandler(resp: any[] | undefined, ignoreErrors: string[] = []) {
    if (resp && resp[1] === 'ERROR') {
      if (ignoreErrors?.includes(resp[2])) {
        // ignore the error
      } else {
        this.stateModel.updateState({ examState: ExamState.DeviceError });
        this.stateModel.updateState({ deviceError: resp });
      }
    }
  }

  /**
   * Replicate the firmware response for when a device is not found.
   */
  async deviceNotFound() {
    const resp = [0, 'ERROR', 'Default device not found error. Make sure it is connected and try again.'];
    await this.deviceErrorHandler(resp);
  }

  /**
   * Produce an error for when the device is handling previous messages.
   */
  async deviceMessagePendingError() {
    const resp = [0, 'ERROR', 'Device is currently handling previous messages, wait until completion to try again.'];
    await this.deviceErrorHandler(resp);
  }

  /** Requests device ID.
   * @summary Requests deviceID
   */
  async requestId(device: ConnectedDevice) {
    let resp: any[] | undefined;
    if (isTympanDevice(device)) {
      const msgId = device.msgId.toString();
      this.deviceUtil.incrementDeviceMsgId(device.deviceId);
      resp = await this.tympanService.requestId(device.deviceId, msgId);
      this.logger.debug('requestId response: ' + JSON.stringify(resp));
      const tabsintId = this.deviceUtil.getTabsintIdFromDeviceId(device.deviceId);
      this.deviceUtil.updateDeviceInfo(tabsintId!, resp[1]);
      // resp = structuredClone(resp);
    }
    return resp;
  }

  /** Queues an exam.
   * @summary Starts an exam on the device
   * @models devices?
   */
  async queueExam(device: ConnectedDevice, examType: string, examProperties: object) {
    // these functions dont need responses (remove if not needed)
    let resp: any[] | undefined;
    if (isTympanDevice(device)) {
      const msgId = device.msgId.toString();
      this.deviceUtil.incrementDeviceMsgId(device.deviceId);
      resp = await this.tympanService.queueExam(device.deviceId, msgId, examType, examProperties);
      this.logger.debug('queueExam response: ' + JSON.stringify(resp));
    } else {
      this.logger.error('Unsupported device type: ' + JSON.stringify(device.type));
    }

    await this.deviceErrorHandler(resp);
    return resp;
  }

  async examSubmission(device: ConnectedDevice, examProperties: object, ignoreErrors: Array<string> = []) {
    let resp: any[] | undefined;
    if (isTympanDevice(device)) {
      const msgId = device.msgId.toString();
      this.deviceUtil.incrementDeviceMsgId(device.deviceId);
      resp = await this.tympanService.examSubmission(device.deviceId, msgId, examProperties);
      this.logger.debug('examSubmission response: ' + JSON.stringify(resp));
    } else {
      this.logger.error('Unsupported device type: ' + JSON.stringify(device.type));
    }

    // need to handle this but its inside of the examsubmission call...
    await this.deviceErrorHandler(resp, ignoreErrors);
    return resp;
  }

  async abortExams(device: ConnectedDevice) {
    let resp: any[] | undefined;
    if (isTympanDevice(device)) {
      const msgId = device.msgId.toString();
      this.deviceUtil.incrementDeviceMsgId(device.deviceId);
      resp = await this.tympanService.abortExams(device.deviceId, msgId);
      this.logger.debug('abortExams response: ' + JSON.stringify(resp));
    } else {
      this.logger.error('Unsupported device type: ' + JSON.stringify(device.type));
    }

    await this.deviceErrorHandler(resp);
    return resp;
  }

  async requestResults(device: ConnectedDevice, timeoutTimeMs: number = 3000) {
    let resp: any[] | undefined;
    if (isTympanDevice(device)) {
      const msgId = device.msgId.toString();
      this.deviceUtil.incrementDeviceMsgId(device.deviceId);
      resp = await this.tympanService.requestResults(device.deviceId, msgId, timeoutTimeMs);
      this.logger.debug('requestResults response: ' + JSON.stringify(resp));
    } else {
      this.logger.error('Unsupported device type: ' + JSON.stringify(device.type));
    }

    await this.deviceErrorHandler(resp);
    return resp;
  }

  /**
   * Check if a device message is pending and alert the user if necessary.
   * @param device Connected device to check for a pending message.
   * @param alert Whether to push an alert to the user.
   * @returns Whether a message is pending or not.
   */
  public isDeviceMessagePending(device: ConnectedDevice | undefined, alert: boolean = true): boolean {
    const pendingMsg = device?.isMsgPending ?? false;
    if (pendingMsg && alert) {
      this.notifications
        .alert({
          title: 'Alert',
          content: 'Device is currently handling previous messages, wait until completion to continue.',
          type: DialogType.Alert,
        })
        .subscribe();
    }
    return pendingMsg;
  }
}
