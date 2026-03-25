import { BehaviorSubject, Observable, Subject, catchError, firstValueFrom, map, of, timeout } from 'rxjs';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Buffer } from 'buffer';
import { IDeviceManager } from '../../interfaces/devices/device-manager.interface';
import { Logger } from '../logger.service';
import { BluetoothType, DeviceState, DialogType, ExamState } from '../../utilities/constants';
import { StateModel } from '../../models/state/state.service';
import { Notifications } from '../notifications.service';
import { TranslateService } from '@ngx-translate/core';
import { Tasks } from '../tasks.service';
import { NgZone } from '@angular/core';
import { IDeviceResponse } from '../../interfaces/devices/device-response.interface';
import { WahtsAdapter } from './wahts-adapter';
import { WahtsDevice } from '../../models/devices/wahts-device';
import { DiscoveryResponse, TabsintCha } from 'tabsintcha';
import { SavedDevice } from '../../models/disk/disk.interface';
import { DiskModel } from '../../models/disk/disk.service';
import { FirmwareAsset } from '../../interfaces/firmware-asset.interface';
import { RequestIdResponse } from '../../interfaces/devices/device-responses.interface';
import { isValidDeviceResponse } from '../../guards/type.guard';

/**
 * WAHTS implementation of the device manager.
 */
export class WahtsManager implements IDeviceManager {
  /**
   * Whether a BLE scan is currently in progress.
   */
  private scanning = false;

  /**
   * Information related to the application held firmware.
   */
  private firmwareAsset: FirmwareAsset | undefined = undefined;

  /**
   * Binary firmware file name.
   */
  private readonly BINARY_FIRMWARE_FILENAME = 'CHA_firmware.dat';

  /**
   * Assets path to the binary firmware file.
   */
  private readonly BINARY_FIRMWARE_PATH = `assets/firmware/${this.BINARY_FIRMWARE_FILENAME}`;

  /**
   * Assets path to the metadata firmware file.
   */
  private readonly METADATA_FIRMWARE_PATH = 'assets/firmware/CHA_firmware.json';

  /**
   * The timeout used for BLE scans.
   */
  private readonly SCAN_TIMEOUT = 10000; // ms

  /**
   * The adapter used for interacting with a device.
   */
  private readonly wahtsAdapter: WahtsAdapter;

  /**
   * Set of device identifiers for devices which have requested a disconnection.
   */
  private readonly requestedDisconnectionIds: Set<string> = new Set<string>();

  /**
   * Behavioral subject for the devices.
   */
  private readonly devicesSubject = new BehaviorSubject<WahtsDevice[]>([]);

  /**
   * Observable for the devices.
   */
  readonly devices: Observable<WahtsDevice[]> = this.devicesSubject.pipe(map(device => structuredClone(device)));

  /**
   * Callback invoked on device discovery events
   */
  private discoverListener: ((response: DiscoveryResponse) => void) | undefined = undefined;

  constructor(
    private readonly logger: Logger,
    private readonly stateModel: StateModel,
    private readonly diskModel: DiskModel,
    private readonly zone: NgZone,
    private readonly notifications: Notifications,
    private readonly translate: TranslateService,
    private readonly tasks: Tasks
  ) {
    this.wahtsAdapter = new WahtsAdapter(logger);
    this.wahtsAdapter.setDisconnectCallback(this.onDisconnectCallback);
    this.wahtsAdapter.setDeviceUpdate(this.updateDevice);
  }

  /**
   * The callback to be invoked when a device property is changed.
   * @param device The device with property changes to be updated.
   */
  updateDevice = (device: WahtsDevice) => {
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
          content: this.translate.instant("The WAHTS device's connection has timed out."),
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
  createDevice(savedDevice: SavedDevice): WahtsDevice {
    const wahtsDevice = new WahtsDevice(savedDevice.deviceId, savedDevice.name, savedDevice.tabsintId);
    wahtsDevice.connectionType = (savedDevice as WahtsDevice).connectionType;
    return wahtsDevice;
  }

  /**
   * Add a device to the device list.
   * @param device The device to be added.
   */
  addDevice(device: WahtsDevice): void {
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
  removeDevice(device: WahtsDevice): void {
    let devices = structuredClone(this.devicesSubject.getValue());
    devices = devices.filter(dev => dev.deviceId != device.deviceId);
    this.devicesSubject.next(devices);
  }

  /**
   * Start a device search to retrieve available devices for the specified device type.
   * The search is limited to the user-specified connection type (BluetoothType).
   * @param deviceType The type of device the search should be started for.
   */
  async startDeviceSearch(): Promise<void> {
    if (this.scanning) {
      return;
    }
    try {
      this.scanning = true;
      const connectionType = (await firstValueFrom(this.diskModel.diskSubject)).preferences.wahtsConnectionType;
      const connectionTypeKey = this.getConnectionKey(connectionType);
      this.discoverListener = (response: DiscoveryResponse) => {
        const newDevice = new WahtsDevice(response.name, response.name);
        newDevice.connectionType = connectionType;
        newDevice.state = DeviceState.Discovery;
        this.addDevice(newDevice);
      };
      TabsintCha.addListener('TabsintChaDiscovery', response => this.discoverListener?.(response));
      await TabsintCha.startChaSearch({ infStr: connectionTypeKey });
    } catch (error) {
      this.scanning = false;
      throw new Error('Error starting BLE scan: ' + JSON.stringify(error));
    }
  }

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
  setTabsintId(device: WahtsDevice, id: string): void {
    const devices = structuredClone(this.devicesSubject.getValue());
    const updatedDevices = devices.map(dev => (dev.deviceId === device.deviceId ? { ...dev, tabsintId: id } : dev));
    this.devicesSubject.next(updatedDevices);
  }

  /**
   * Connect to the device.
   * @param device The device to be connected to.
   */
  async connect(device: WahtsDevice): Promise<void> {
    // Connection process which calls a new search callback if initial connection fails.
    const connectWithRetry = async () => {
      try {
        await this.wahtsAdapter.connect(device);
      } catch {
        const deviceSubject = new Subject<WahtsDevice>();
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
        await this.wahtsAdapter.connect(device);
      }
    };
    try {
      this.tasks.register('Connect Device', 'Connecting to Device...');
      await connectWithRetry();
      await this.wahtsAdapter.abortExams(device);
      const resp = await this.wahtsAdapter.requestId(device);
      if (!isValidDeviceResponse(resp)) {
        await this.disconnect(device);
        throw new Error('Reconnection failed.');
      }
      this.stateModel.updatePaneOpen({ wahts: true });
      this.updateDeviceMetadata(device, resp.msg[1] as RequestIdResponse);
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
  async disconnect(device: WahtsDevice): Promise<void> {
    this.requestedDisconnectionIds.add(device.deviceId);
    await this.wahtsAdapter.disconnect(device);
    device.state = DeviceState.Disconnected;
    this.updateDevice(device);
  }

  /**
   * Request a device identifier.
   * @param device The device to request the identifier from.
   */
  async requestId(device: WahtsDevice): Promise<IDeviceResponse> {
    const response = await this.wahtsAdapter.requestId(device);
    await this.deviceErrorHandler(response);
    return response;
  }

  /**
   * Queue an exam for a device.
   * @param device The device to queue the exam for.
   * @param examId The identifier of the exam to be queued.
   * @param examProperties Object holding properties related to the exam.
   */
  async queueExam(device: WahtsDevice, examId: string, examProperties: object): Promise<IDeviceResponse> {
    const response = await this.wahtsAdapter.queueExam(device, examId, examProperties);
    await this.deviceErrorHandler(response);
    return response;
  }

  /**
   * Submit an exam submission for a device.
   * @param device The device which the submission will be sent to.
   * @param examProperties Object holding properties related to the exam.
   * @param ignoreErrors A list of keywords for which matching errors will be ignored.
   */
  async examSubmission(device: WahtsDevice, examProperties: object, ignoreErrors: string[]): Promise<IDeviceResponse> {
    const response = await this.wahtsAdapter.examSubmission(device, examProperties, ignoreErrors);
    await this.deviceErrorHandler(response);
    return response;
  }

  /**
   * Abort an exam for a device.
   * @param device The device to abort the exam for.
   */
  async abortExams(device: WahtsDevice): Promise<IDeviceResponse> {
    const response = await this.wahtsAdapter.abortExams(device);
    await this.deviceErrorHandler(response);
    return response;
  }

  /**
   * Request results from an exam for a device.
   * @param device The device to request exam results from.
   * @param examId The identifier of the exam to request results for.
   */
  async requestResults(device: WahtsDevice): Promise<IDeviceResponse> {
    const response = await this.wahtsAdapter.requestResults(device);
    await this.deviceErrorHandler(response);
    return response;
  }

  /**
   * Reprogram a device.
   * @param device The device to reprogram.
   * @returns The device response for the reprogram request.
   */
  async reprogramFirmware(device: WahtsDevice): Promise<IDeviceResponse> {
    const firmwareTask = 'Transfer Firmware';
    this.tasks.register(firmwareTask, 'Transferring Firmware to the Device...');
    const firmwareErrorResponse = { deviceId: device.deviceId, msg: ['Error', 'Failed to create firmware asset'] };
    try {
      if (!this.firmwareAsset) {
        this.firmwareAsset = await this.loadFirmwareAsset();
        if (!this.firmwareAsset) {
          this.tasks.deregister(firmwareTask);
          await this.deviceErrorHandler(firmwareErrorResponse);
          return firmwareErrorResponse;
        }
      }
      const response = await this.wahtsAdapter.reprogramFirmware(device, this.firmwareAsset);
      this.tasks.deregister(firmwareTask);
      await this.deviceErrorHandler(response);
      return response;
    } catch (error) {
      this.logger.error('Error while reprogramming firmware: ' + error);
      this.tasks.deregister(firmwareTask);
      await this.deviceErrorHandler(firmwareErrorResponse);
      return firmwareErrorResponse;
    }
  }

  /**
   * Reboot a device.
   * @param device The device to reboot.
   * @param examId The device response for the reboot request.
   */
  async reboot(device: WahtsDevice): Promise<IDeviceResponse> {
    const response = await this.wahtsAdapter.reboot(device);
    await this.deviceErrorHandler(response);
    return response;
  }

  /**
   * Get firmware information for the available application firmware.
   * @returns The firmware asset provided by the application for the managed device type or undefined.
   */
  async getApplicationFirmware(): Promise<FirmwareAsset | undefined> {
    if (!this.firmwareAsset) {
      this.firmwareAsset = await this.loadFirmwareAsset();
    }
    return this.firmwareAsset;
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
   * Update the metadata for a device with request ID information.
   * If a serial number is negative, wrap the value.
   * @param device The device to update.
   * @param idResponse Request ID response information.
   */
  private updateDeviceMetadata(device: WahtsDevice, idResponse: RequestIdResponse) {
    device.metadata.buildDateTime = idResponse.buildDateTime;
    device.metadata.serialNumber = idResponse.serialNumber
      ? (idResponse.serialNumber < 0 ? 0xffffffff + idResponse.serialNumber + 1 : idResponse.serialNumber).toString()
      : undefined;
    this.updateDevice(device);
  }

  /**
   * Determine the key of BluetoothType needed for the TabsintCha plugin.
   * @param connectionType The BluetoothType for the device.
   * @returns The string representation of the BluetoothType key.
   */
  private getConnectionKey(connectionType: BluetoothType): string {
    return Object.keys(BluetoothType).find(k => BluetoothType[k as keyof typeof BluetoothType] === connectionType) ?? 'BLUETOOTH_LE';
  }

  /**
   * Load a firmware asset and create the firmware file in an accessible location for the CHA plugin.
   * @returns The created firmware asset or undefined.
   */
  private async loadFirmwareAsset(): Promise<FirmwareAsset | undefined> {
    const firmwareResponse = await fetch(this.BINARY_FIRMWARE_PATH);
    const metadataResponse = await fetch(this.METADATA_FIRMWARE_PATH);

    const buffer = await firmwareResponse.arrayBuffer();
    const metadataJSON = await metadataResponse.json();

    const base64Data = Buffer.from(buffer).toString('base64');
    const checksum = this.calculateCRC32(new Uint8Array(buffer));

    const writeResponse = await Filesystem.writeFile({
      path: this.BINARY_FIRMWARE_FILENAME,
      data: base64Data,
      directory: Directory.Data,
    });

    if (!writeResponse.uri || !metadataJSON.tag || !metadataJSON.time) {
      this.logger.error('Failed to generate the firmware asset');
      return undefined;
    }
    // Make the path accessible via Java
    const updatedFilePath = writeResponse.uri.replace('file://', '');

    return {
      fileName: this.BINARY_FIRMWARE_FILENAME,
      filePath: updatedFilePath,
      version: String(metadataJSON.tag),
      buildDatetime: String(metadataJSON.time),
      checksum: checksum,
    };
  }

  /**
   * Calculate a CRC32 checksum for a byte array.
   * @param byteArray The byte array for checksum calculation.
   * @returns The CRC32 checksum.
   */
  private calculateCRC32(byteArray: Uint8Array): number {
    const crcTable = new Uint32Array(256);
    for (let index = 0; index <= 255; index++) {
      let tableValue = index;
      for (let k = 0; k <= 7; k++) {
        const leastSignificantBit = tableValue & 1;
        if (leastSignificantBit === 1) {
          const reversedGeneratorPolynomial = 0xedb88320;
          tableValue = reversedGeneratorPolynomial ^ (tableValue >>> 1);
        } else {
          tableValue = tableValue >>> 1;
        }
      }
      crcTable[index] = tableValue >>> 0;
    }
    const maxInt32 = 0xffffffff;
    let crcValue = maxInt32;
    for (const byte of byteArray) {
      const crcTableIndex = (crcValue ^ byte) & 255;
      crcValue = crcTable[crcTableIndex] ^ (crcValue >>> 8);
    }
    crcValue = (crcValue ^ maxInt32) >>> 0;
    return crcValue;
  }
}
