import { BehaviorSubject, Observable, map } from 'rxjs';
import { IDeviceManager } from '../../interfaces/devices/device-manager.interface';
import { BleClient, ScanResult } from '@capacitor-community/bluetooth-le';
import { TympanDevice } from '../../models/devices/tympan-device';
import { TympanAdapter } from './tympan-adapter';
import { Logger } from '../logger.service';
import { DeviceState, DialogType, ExamState } from '../../utilities/constants';
import { StateModel } from '../../models/state/state.service';
import { Notifications } from '../notifications.service';
import { TranslateService } from '@ngx-translate/core';
import { Tasks } from '../tasks.service';
import { inject, NgZone } from '@angular/core';
import { IDeviceResponse } from '../../interfaces/devices/device-response.interface';
import { SavedDevice } from '../../models/disk/disk.interface';

/**
 * Tympan implementation of the device manager.
 */
export class TympanManager implements IDeviceManager {
  private readonly logger = inject(Logger);
  private readonly stateModel = inject(StateModel);
  private readonly zone = inject(NgZone);
  private readonly notifications = inject(Notifications);
  private readonly translate = inject(TranslateService);
  private readonly tasks = inject(Tasks);

  /**
   * Whether a BLE scan is currently in progress.
   */
  private scanning = false;

  /**
   * The timeout used for BLE scans.
   */
  private readonly SCAN_TIMEOUT = 5000; // ms

  /**
   * The adapter used for interacting with a device.
   */
  private readonly tympanAdapter: TympanAdapter;

  /**
   * Set of device identifiers for devices which have requested a disconnection.
   */
  private readonly requestedDisconnectionIds: Set<string> = new Set<string>();

  /**
   * Behavioral subject for the devices.
   */
  private readonly devicesSubject = new BehaviorSubject<TympanDevice[]>([]);

  /**
   * Observable for the devices.
   */
  readonly devices: Observable<TympanDevice[]> = this.devicesSubject.pipe(map(device => structuredClone(device)));

  constructor() {
    this.tympanAdapter = new TympanAdapter();
    this.tympanAdapter.setDisconnectCallback(this.onDisconnectCallback);
    this.tympanAdapter.setDeviceUpdate(this.updateDevice);
  }

  /**
   * The callback to be invoked when a device property is changed.
   * @param device The device with property changes to be updated.
   */
  updateDevice = (device: TympanDevice) => {
    const devices = this.devicesSubject.getValue();
    const updatedDevice = devices.find(dev => dev.deviceId === device.deviceId);
    if (updatedDevice) {
      const devicesFiltered = devices.filter(dev => dev.deviceId !== device.deviceId);
      devicesFiltered.push(device);
      this.devicesSubject.next(devicesFiltered);
    }
  };

  /**
   * The callback to invoked when a device disconnection occurs.
   * @param deviceId The device identifier of the disconnected device.
   */
  onDisconnectCallback = (deviceId: string) => {
    this.zone.run(() => {
      const devices = structuredClone(this.devicesSubject.getValue());
      const newDevices = devices.map(device => (device.deviceId === deviceId ? { ...device, state: DeviceState.Disconnected } : device));
      this.devicesSubject.next(newDevices);
      if (!this.requestedDisconnectionIds.has(deviceId)) {
        this.notifications.alert({
          title: 'Alert',
          content: this.translate.instant("The tympan device's connection has timed out."),
          type: DialogType.Alert,
        });
      }
      this.requestedDisconnectionIds.delete(deviceId);
    });
    this.logger.debug(`device ${deviceId} disconnected`);
  };

  /**
   * Create a new device from a saved device.
   * @param savedDevice The saved device to create a device for.
   * @returns The created device.
   */
  createDevice(savedDevice: SavedDevice): TympanDevice {
    const tympanDevice = new TympanDevice(savedDevice.deviceId, savedDevice.name, savedDevice.tabsintId);
    return tympanDevice;
  }

  /**
   * Add a device to the device list.
   * @param device The device to be added.
   */
  addDevice(device: TympanDevice): void {
    const devices = structuredClone(this.devicesSubject.getValue());
    if (!devices.some(dev => dev.deviceId == device.deviceId)) {
      devices.push(device);
      this.devicesSubject.next(devices);
    }
  }

  /**
   * Remove a device from the device list.
   * @param device The device to be removed.
   */
  removeDevice(device: TympanDevice): void {
    let devices = structuredClone(this.devicesSubject.getValue());
    devices = devices.filter(dev => dev.deviceId != device.deviceId);
    this.devicesSubject.next(devices);
  }

  /**
   * Start a device search to retrieve available devices for the specified device type.
   * @param deviceType The type of device the search should be started for.
   */
  async startDeviceSearch(): Promise<void> {
    if (this.scanning) {
      return;
    }
    try {
      this.scanning = true;
      const results: TympanDevice[] = [];
      const scan = async () => {
        await BleClient.requestLEScan({ services: [this.tympanAdapter.ADAFRUIT_SERVICE_UUID] }, (result: ScanResult) => {
          if (!results.some(res => res.deviceId === result.device.deviceId)) {
            const tympanDevice = new TympanDevice(result.device.deviceId, result.device.name ?? '');
            tympanDevice.state = DeviceState.Discovery;
            results.push(tympanDevice);
          }
          const devices = this.devicesSubject.getValue();
          const deviceIds = devices.map(device => device.deviceId);
          results.forEach(device => {
            if (!deviceIds.includes(device.deviceId)) {
              devices.push(device);
            }
          });
          this.devicesSubject.next(devices);
        });
        setTimeout(async () => {
          await BleClient.stopLEScan();
          if (this.scanning) {
            await scan();
          }
        }, this.SCAN_TIMEOUT);
      };
      await scan();
    } catch (error) {
      this.scanning = false;
      throw new Error('Error starting BLE scan: ' + JSON.stringify(error));
    }
  }

  /**
   * Stop an ongoing device search.
   */
  async stopDeviceSearch(): Promise<void> {
    await BleClient.stopLEScan();
    this.scanning = false;
    // Remove discovered devices which were added but not selected during the search
    let devices = this.devicesSubject.getValue();
    devices = devices.filter(device => device.state === DeviceState.Discovery);
    this.devicesSubject.next(devices);
  }

  /**
   * Set the TabSINT identifier for the provided device.
   * @param device The device whose matching reference should be updated.
   * @param id The new TabSINT identifier for the device.
   */
  setTabsintId(device: TympanDevice, id: string): void {
    const devices = structuredClone(this.devicesSubject.getValue());
    const updatedDevices = devices.map(dev => (dev.deviceId === device.deviceId ? { ...dev, tabsintId: id } : dev));
    this.devicesSubject.next(updatedDevices);
  }

  /**
   * Connect to the device.
   * @param device The device to be connected to.
   */
  async connect(device: TympanDevice): Promise<void> {
    try {
      this.tasks.register('Connect Device', 'Connecting to Device...');
      await this.tympanAdapter.connect(device);
      await this.tympanAdapter.abortExams(device);
      const resp = await this.tympanAdapter.requestId(device);
      if (!resp.msg || resp.msg.includes('ERROR')) {
        await this.disconnect(device);
        throw new Error('Reconnection failed.');
      }
      this.stateModel.updatePaneOpen({ tympans: true });
      this.tasks.deregister('Connect Device');
      device.state = DeviceState.Connected;
      this.updateDevice(device);
    } catch (err) {
      this.tasks.deregister('Connect Device');
      device.state = DeviceState.Disconnected;
      this.updateDevice(device);
      throw err;
    }
  }

  /**
   * Disconnect from the device.
   * @param device The device to be disconnected from.
   */
  async disconnect(device: TympanDevice): Promise<void> {
    this.requestedDisconnectionIds.add(device.deviceId);
    await this.tympanAdapter.disconnect(device);
    device.state = DeviceState.Disconnected;
    this.updateDevice(device);
  }

  /**
   * Request a device identifier.
   * @param device The device to request the identifier from.
   */
  async requestId(device: TympanDevice): Promise<IDeviceResponse> {
    const response = await this.tympanAdapter.requestId(device);
    await this.deviceErrorHandler(response);
    return response;
  }

  /**
   * Queue an exam for a device.
   * @param device The device to queue the exam for.
   * @param examId The identifier of the exam to be queued.
   * @param examProperties Object holding properties related to the exam.
   */
  async queueExam(device: TympanDevice, examId: string, examProperties: object): Promise<IDeviceResponse> {
    const response = await this.tympanAdapter.queueExam(device, examId, examProperties);
    await this.deviceErrorHandler(response);
    return response;
  }

  /**
   * Submit an exam submission for a device.
   * @param device The device which the submission will be sent to.
   * @param examProperties Object holding properties related to the exam.
   * @param ignoreErrors A list of keywords for which matching errors will be ignored.
   */
  async examSubmission(device: TympanDevice, examProperties: object, ignoreErrors: string[]): Promise<IDeviceResponse> {
    const response = await this.tympanAdapter.examSubmission(device, examProperties, ignoreErrors);
    await this.deviceErrorHandler(response);
    return response;
  }

  /**
   * Abort an exam for a device.
   * @param device The device to abort the exam for.
   */
  async abortExams(device: TympanDevice): Promise<IDeviceResponse> {
    const response = await this.tympanAdapter.abortExams(device);
    await this.deviceErrorHandler(response);
    return response;
  }

  /**
   * Request results from an exam for a device.
   * @param device The device to request exam results from.
   * @param examId The identifier of the exam to request results for.
   */
  async requestResults(device: TympanDevice): Promise<IDeviceResponse> {
    const response = await this.tympanAdapter.requestResults(device);
    await this.deviceErrorHandler(response);
    return response;
  }

  /**
   * Check for device errors and update the application state model if an error occurs.
   * @param resp The response to check for errors.
   * @param ignoreErrors Errors which should be ignored during the check.
   */
  private async deviceErrorHandler(resp: IDeviceResponse | undefined, ignoreErrors: string[] = []) {
    if (resp?.msg[1] === 'ERROR') {
      if (typeof resp.msg[2] === 'string' && ignoreErrors?.includes(resp.msg[2])) {
        // ignore the error
      } else {
        this.stateModel.updateState({ examState: ExamState.DeviceError });
        this.stateModel.updateState({ deviceError: resp.msg });
      }
    }
  }
}
