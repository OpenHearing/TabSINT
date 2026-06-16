import { BehaviorSubject, Observable, Subject, catchError, firstValueFrom, map, of, timeout } from 'rxjs';
import { IDeviceManager } from '../../interfaces/devices/device-manager.interface';
import { Logger } from '../logger.service';
import { BluetoothType, ChaDeviceType, DeviceState, DialogType, ExamState } from '../../utilities/constants';
import { StateModel } from '../../models/state/state.service';
import { Notifications } from '../notifications.service';
import { TranslocoService } from '@jsverse/transloco';
import { Tasks } from '../tasks.service';
import { inject, NgZone } from '@angular/core';
import { IDeviceResponse } from '../../interfaces/devices/device-response.interface';
import { ChaAdapter } from './cha-adapter';
import { DiscoveryResponse, TabsintCha } from 'tabsintcha';
import { SavedDevice } from '../../models/disk/disk.interface';
import { DiskModel } from '../../models/disk/disk.service';

import { DirectoryEntryObject, RequestIdObject, RequestSettingObject, StatusObject } from '../../interfaces/devices/device-responses.interface';
import { isGetDirectoryResponse, isLongNameResponse, isRequestIdResponse, isRequestSettingResponse, isStatusResponse } from '../../guards/type.guard';
import { ChaMediaHandler } from './cha-media-handler';

/**
 * CHA base device manager.
 */
export abstract class ChaManager implements IDeviceManager {
  protected readonly logger = inject(Logger);
  protected readonly stateModel = inject(StateModel);
  protected readonly diskModel = inject(DiskModel);
  protected readonly zone = inject(NgZone);
  protected readonly notifications = inject(Notifications);
  protected readonly transloco = inject(TranslocoService);
  protected readonly tasks = inject(Tasks);

  /**
   * Whether a BLE scan is currently in progress.
   */
  protected scanning = false;

  /**
   * The timeout used for BLE scans.
   */
  protected readonly SCAN_TIMEOUT = 10000; // ms

  /**
   * The adapter used for interacting with a device.
   */
  protected readonly adapter: ChaAdapter = new ChaAdapter();

  /**
   * The media handler used for interacting with a device.
   */
  protected readonly mediaHandler: ChaMediaHandler = new ChaMediaHandler(this.adapter);

  /**
   * Set of device identifiers for devices which have requested a disconnection.
   */
  protected readonly requestedDisconnectionIds: Set<string> = new Set<string>();

  /**
   * Behavioral subject for the devices.
   */
  protected readonly devicesSubject = new BehaviorSubject<ChaDeviceType[]>([]);

  /**
   * Observable for the devices.
   */
  readonly devices: Observable<ChaDeviceType[]> = this.devicesSubject.pipe(map(device => structuredClone(device)));

  /**
   * Callback invoked on device discovery events
   */
  protected discoveryListener: ((response: DiscoveryResponse) => void) | undefined = undefined;

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
          content: this.transloco.translate("The CHA device's connection has timed out."),
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
    devices = devices.filter(device => device.state !== DeviceState.Discovery);
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
   * Set the connectionType identifier for the provided device in the device list.
   * @param device The device whose matching reference in the device list should be updated.
   * @param connectionType The new connectionType identifier for the device.
   */
  updateDeviceConnectionType(device: ChaDeviceType, connectionType: BluetoothType): void {
    const devices = structuredClone(this.devicesSubject.getValue());
    const updatedDevices = devices.map(dev => (dev.deviceId === device.deviceId ? { ...dev, connectionType } : dev));
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

      const requestIdResp = await this.requestId(device);
      if (!isRequestIdResponse(requestIdResp)) {
        await this.disconnect(device);
        throw new Error('Connection failed.');
      }
      this.updateDeviceMetadata(device, requestIdResp.msg[1]);

      const requestStatusResp = await this.requestStatus(device);
      if (!isStatusResponse(requestStatusResp)) {
        await this.disconnect(device);
        throw new Error('Connection failed.');
      }

      const requestSettingResp = await this.requestSetting(device, 'auto_shutdown_time');
      if (!isRequestSettingResponse(requestSettingResp)) {
        await this.disconnect(device);
        throw new Error('Connection failed.');
      }

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
   * Request the status of a device.
   * @param device The device to request the status from.
   */
  async requestStatus(device: ChaDeviceType): Promise<IDeviceResponse> {
    const response = await this.adapter.requestStatus(device);
    await this.deviceErrorHandler(response);
    this.updateBatteryInformation(device, response.msg[1] as StatusObject);
    return response;
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
   * Reboot a device.
   * @param device The device to reboot.
   * @param examId The device response for the reboot request.
   */
  async reboot(device: ChaDeviceType): Promise<IDeviceResponse> {
    this.requestedDisconnectionIds.add(device.deviceId);
    const response = await this.adapter.reboot(device);
    await this.deviceErrorHandler(response);
    return response;
  }

  /**
   * Check for device errors and update the application state model if an error occurs.
   * @param resp The response to check for errors.
   * @param ignoreErrors Errors which should be ignored during the check.
   */
  protected async deviceErrorHandler(resp: IDeviceResponse | undefined, ignoreErrors: string[] = []) {
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
  protected getConnectionKey(connectionType: BluetoothType): string {
    return Object.keys(BluetoothType).find(k => BluetoothType[k as keyof typeof BluetoothType] === connectionType) ?? 'BLUETOOTH_LE';
  }

  /**
   * Update the metadata for a device with request ID information.
   * If a serial number is negative, wrap the value.
   * @param device The device to update.
   * @param idResponse Request ID information.
   */
  protected updateDeviceMetadata(device: ChaDeviceType, idResponse: RequestIdObject) {
    device.metadata.buildDateTime = idResponse.buildDateTime;
    let serialNumber = idResponse.serialNumber;
    if (serialNumber < 0) {
      serialNumber = serialNumber + 0xffffffff + 1;
    }
    device.metadata.serialNumber = serialNumber.toString();
    const dateRegex = /.*(([0-9]{4})-?(1[0-2]|0[1-9])-?(3[01]|0[1-9]|[12][0-9])).*$/;
    device.metadata.calibrationDate = dateRegex.exec(idResponse.description!)?.[1] ?? 'N/A';
    this.updateDevice(device);
  }

  /**
   * Update the auto shutdown time for a device with request setting information.
   * @param device The device to update.
   * @param settingResponse Request Setting information.
   */
  protected updateAutoShutdownTime(device: ChaDeviceType, settingResponse: RequestSettingObject) {
    device.metadata.autoShutdownTime = settingResponse.Value;
    this.updateDevice(device);
  }

  /**
   * Update the battery level information for a device with request status information.
   * @param device The device to update.
   * @param statusResponse Request Status information.
   */
  abstract updateBatteryInformation(device: ChaDeviceType, statusResponse: StatusObject): void;

  /**
   * Request amount of free space on a device.
   * @param device The device to request the identifier from.
   */
  async requestSdBytesFree(device: ChaDeviceType): Promise<IDeviceResponse> {
    const response = await this.adapter.requestSdBytesFree(device);
    await this.deviceErrorHandler(response);
    return response;
  }

  /**
   * Request Setting.
   * @param device The device to request the setting from.
   * @param setting The setting to request.
   */
  async requestSetting(device: ChaDeviceType, setting: string): Promise<IDeviceResponse> {
    const response = await this.adapter.requestSetting(device, setting);
    await this.deviceErrorHandler(response);
    if (isRequestSettingResponse(response)) {
      this.updateAutoShutdownTime(device, response.msg[1]);
    }
    return response;
  }

  /**
   * Write Setting.
   * @param device The device to write the setting to.
   * @param setting The setting to be written.
   * @param value The value of the setting to be written.
   */
  async writeSetting(device: ChaDeviceType, setting: string, value: number): Promise<IDeviceResponse> {
    const response = await this.adapter.writeSetting(device, setting, value);
    await this.deviceErrorHandler(response);
    return response;
  }

  /**
   * Request long file names from a directory on a device.
   * @param device The device to request the long directory names from.
   * @param baseDir The directory to request long directory names from.
   */
  async getDirectoryLongNames(device: ChaDeviceType, baseDir: string): Promise<IDeviceResponse> {
    const longNames: string[] = [];
    let entries: DirectoryEntryObject[] = [];
    const getDirectoryResponse = await this.adapter.getDirectory(device, baseDir);
    await this.deviceErrorHandler(getDirectoryResponse);
    if (isGetDirectoryResponse(getDirectoryResponse)) {
      entries = getDirectoryResponse['msg'][1];
    }

    for (const entry of entries) {
      const longNameResponse = await this.adapter.getChaLongName(device, baseDir + entry.path);
      await this.deviceErrorHandler(longNameResponse);
      if (isLongNameResponse(longNameResponse) && longNameResponse['msg'][0] !== '') {
        longNames.push(longNameResponse['msg'][0] as string);
      }
    }

    const resp = { deviceId: device.deviceId, msg: ['Success', longNames] };
    return resp;
  }

  /**
   * Copy file from device onto tablet and read it (DuoDose only?).
   * @param device The device to copy and read the file from.
   * @param fileToRead The file to copy and read.
   */
  async copyChaFileToLocalStorageAndReadFile(device: ChaDeviceType, fileToRead: string): Promise<IDeviceResponse | undefined> {
    const response = await this.adapter.copyChaFileToLocalStorageAndReadFile(device, fileToRead);
    await this.deviceErrorHandler(response);
    return response;
  }

  /**
   * Transfer directory content to a device.
   * @param device The device to transfer files to.
   * @param localDirectory The directory to transfer files from recursively.
   * @param remoteDirectory The directory to transfer the files to.
   * @returns The device response for the request or undefined.
   */
  async transferDirectory(device: ChaDeviceType, localDirectory: string, remoteDirectory: string): Promise<IDeviceResponse> {
    const response = await this.mediaHandler.syncRemoteToLocalDirectory(device, localDirectory, remoteDirectory);
    await this.deviceErrorHandler(response);
    return response;
  }

  /**
   * Cancel any ongoing file operation.
   * @param device The device to cancel the file operation on.
   * @returns The device response for the request or undefined.
   */
  async cancelFileOperation(device: ChaDeviceType): Promise<IDeviceResponse> {
    const response = await this.adapter.cancelFileOperation(device);
    await this.deviceErrorHandler(response);
    return response;
  }
}
