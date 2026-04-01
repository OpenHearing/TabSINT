import { BehaviorSubject, Observable, Subject, catchError, firstValueFrom, map, of, timeout } from 'rxjs';
import { IDeviceManager } from '../../interfaces/devices/device-manager.interface';
import { Logger } from '../logger.service';
import { BluetoothType, ChaDeviceType, DeviceState, DialogType, ExamState } from '../../utilities/constants';
import { StateModel } from '../../models/state/state.service';
import { Notifications } from '../notifications.service';
import { TranslateService } from '@ngx-translate/core';
import { Tasks } from '../tasks.service';
import { inject, NgZone } from '@angular/core';
import { IDeviceResponse } from '../../interfaces/devices/device-response.interface';
import { ChaAdapter } from './cha-adapter';
import { DiscoveryResponse, TabsintCha } from 'tabsintcha';
import { SavedDevice } from '../../models/disk/disk.interface';
import { DiskModel } from '../../models/disk/disk.service';

/**
 * CHA base device manager.
 */
export abstract class ChaManager implements IDeviceManager {
  private readonly logger = inject(Logger);
  private readonly stateModel = inject(StateModel);
  public readonly diskModel = inject(DiskModel);
  private readonly zone = inject(NgZone);
  private readonly notifications = inject(Notifications);
  private readonly translate = inject(TranslateService);
  private readonly tasks = inject(Tasks);

  /**
   * Whether a BLE scan is currently in progress.
   */
  public scanning = false;

  /**
   * The timeout used for BLE scans.
   */
  private readonly SCAN_TIMEOUT = 10000; // ms

  /**
   * The adapter used for interacting with a device.
   */
  private readonly adapter: ChaAdapter = new ChaAdapter();

  /**
   * Set of device identifiers for devices which have requested a disconnection.
   */
  private readonly requestedDisconnectionIds: Set<string> = new Set<string>();

  /**
   * Behavioral subject for the devices.
   */
  private readonly devicesSubject = new BehaviorSubject<ChaDeviceType[]>([]);

  /**
   * Observable for the devices.
   */
  readonly devices: Observable<ChaDeviceType[]> = this.devicesSubject.pipe(map(device => structuredClone(device)));

  /**
   * Callback invoked on device discovery events
   */
  public discoveryListener: ((response: DiscoveryResponse) => void) | undefined = undefined;

  constructor() {
    this.adapter.setDisconnectCallback(this.onDisconnectCallback);
    this.adapter.setDeviceUpdate(this.updateDevice);
  }

  /**
   * The callback to be invoked when a device property is changed.
   * @param device The device with property changes to be updated.
   */
  updateDevice = (device: ChaDeviceType) => {
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
  abstract createDevice(savedDevice: SavedDevice): ChaDeviceType;

  /**
   * Add a device to the device list.
   * @param device The device to be added.
   */
  addDevice(device: ChaDeviceType): void {
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
  removeDevice(device: ChaDeviceType): void {
    let devices = structuredClone(this.devicesSubject.getValue());
    devices = devices.filter(dev => dev.deviceId != device.deviceId);
    this.devicesSubject.next(devices);
  }

  /**
   * Start a device search to retrieve available devices for the specified device type.
   * The search is limited to the user-specified connection type (BluetoothType).
   * @param deviceType The type of device the search should be started for.
   */
  abstract startDeviceSearch(): Promise<void>;

  /**
   * Stop an ongoing device search.
   */
  async stopDeviceSearch(): Promise<void> {
    await TabsintCha.cancelChaSearch(new Object());
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
  setTabsintId(device: ChaDeviceType, id: string): void {
    const devices = structuredClone(this.devicesSubject.getValue());
    const updatedDevices = devices.map(dev => (dev.deviceId === device.deviceId ? { ...dev, tabsintId: id } : dev));
    this.devicesSubject.next(updatedDevices);
  }

  /**
   * Connect to the device.
   * @param device The device to be connected to.
   */
  async connect(device: ChaDeviceType): Promise<void> {
    // Connection process which calls a new search callback if initial connection fails.
    const connectWithRetry = async () => {
      try {
        await this.adapter.connect(device);
      } catch {
        const deviceSubject = new Subject<ChaDeviceType>();
        const listener = (response: DiscoveryResponse) => {
          if (response.name === device.deviceId) {
            deviceSubject.next(device);
          }
        };
        TabsintCha.addListener('TabsintChaDiscovery', response => listener(response));
        await TabsintCha.startChaSearch({ infStr: this.getConnectionKey(device.connectionType) });
        await firstValueFrom(
          deviceSubject.pipe(
            timeout(this.SCAN_TIMEOUT),
            catchError(() => of(undefined))
          )
        );
        await TabsintCha.cancelChaSearch(new Object());
        await this.adapter.connect(device);
      }
    };
    try {
      this.tasks.register('Connect Device', 'Connecting to Device...');
      await connectWithRetry();
      await this.adapter.abortExams(device);
      const resp = await this.adapter.requestId(device);
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
  async disconnect(device: ChaDeviceType): Promise<void> {
    this.requestedDisconnectionIds.add(device.deviceId);
    await this.adapter.disconnect(device);
    device.state = DeviceState.Disconnected;
    this.updateDevice(device);
  }

  /**
   * Request a device identifier.
   * @param device The device to request the identifier from.
   */
  async requestId(device: ChaDeviceType): Promise<IDeviceResponse> {
    const response = await this.adapter.requestId(device);
    await this.deviceErrorHandler(response);
    return response;
  }

  /**
   * Queue an exam for a device.
   * @param device The device to queue the exam for.
   * @param examId The identifier of the exam to be queued.
   * @param examProperties Object holding properties related to the exam.
   */
  async queueExam(device: ChaDeviceType, examId: string, examProperties: object): Promise<IDeviceResponse> {
    const response = await this.adapter.queueExam(device, examId, examProperties);
    await this.deviceErrorHandler(response);
    return response;
  }

  /**
   * Submit an exam submission for a device.
   * @param device The device which the submission will be sent to.
   * @param examProperties Object holding properties related to the exam.
   * @param ignoreErrors A list of keywords for which matching errors will be ignored.
   */
  async examSubmission(device: ChaDeviceType, examProperties: object, ignoreErrors: string[]): Promise<IDeviceResponse> {
    const response = await this.adapter.examSubmission(device, examProperties, ignoreErrors);
    await this.deviceErrorHandler(response);
    return response;
  }

  /**
   * Abort an exam for a device.
   * @param device The device to abort the exam for.
   */
  async abortExams(device: ChaDeviceType): Promise<IDeviceResponse> {
    const response = await this.adapter.abortExams(device);
    await this.deviceErrorHandler(response);
    return response;
  }

  /**
   * Request results from an exam for a device.
   * @param device The device to request exam results from.
   * @param examId The identifier of the exam to request results for.
   */
  async requestResults(device: ChaDeviceType): Promise<IDeviceResponse> {
    const response = await this.adapter.requestResults(device);
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

  /**
   * Determine the key of BluetoothType needed for the TabsintCha plugin.
   * @param connectionType The BluetoothType for the device.
   * @returns The string representation of the BluetoothType key.
   */
  public getConnectionKey(connectionType: BluetoothType): string {
    return Object.keys(BluetoothType).find(k => BluetoothType[k as keyof typeof BluetoothType] === connectionType) ?? 'BLUETOOTH_LE';
  }
}
