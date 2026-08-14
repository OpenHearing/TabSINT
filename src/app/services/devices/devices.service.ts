import { inject, Injectable, NgZone } from '@angular/core';
import { BluetoothType, DeviceState, DeviceStatus, DeviceType, DialogType, ExamState } from '../../utilities/constants';
import { IDeviceManager } from '../../interfaces/devices/device-manager.interface';
import { StateModel } from '../../models/state/state.service';
import { Notifications } from '../notifications.service';
import { TranslocoService } from '@jsverse/transloco';
import { TympanManager } from './tympan-manager';
import { Device } from '@capacitor/device';
import { Logger } from '../logger.service';
import { BleClient } from '@capacitor-community/bluetooth-le';
import { Tasks } from '../tasks.service';
import { DiskModel } from '../../models/disk/disk.service';
import { SavedDevice } from '../../models/disk/disk.interface';
import { BehaviorSubject, combineLatest, concatMap, firstValueFrom, map, Observable } from 'rxjs';
import { IDevice } from '../../interfaces/devices/device.interface';
import { IWahtsDevice } from '../../interfaces/devices/wahts-device.interface';
import { IDeviceMetadata } from '../../interfaces/devices/device-metadata.interface';
import { IDeviceResponse } from '../../interfaces/devices/device-response.interface';
import { DeviceChooseComponent } from '../../views/devices/device-views/device-choose/device-choose.component';
import { MatDialog } from '@angular/material/dialog';
import { MaskingNoise } from '../../views/response-area/response-areas/shared/audiometry/audiometry.interface';
import { WahtsManager } from './wahts-manager';
import { FirmwareAsset } from '../../interfaces/firmware-asset.interface';
import { DialogDataInterface } from '../../interfaces/dialog-data.interface';
import { isValidDeviceResponse } from '../../guards/type.guard';
import { DuodoseManager } from './duodose-manager';
import { SvantekManager } from './svantek-manager';
import { ISvantekDevice } from '../../interfaces/devices/svantek-device.interface';
import { SvantekResultInterface } from '../../interfaces/svantek-result.interface';

@Injectable({
  providedIn: 'root',
})
export class DevicesService {
  private readonly logger = inject(Logger);
  private readonly stateModel = inject(StateModel);
  private readonly zone = inject(NgZone);
  private readonly notifications = inject(Notifications);
  private readonly transloco = inject(TranslocoService);
  private readonly tasks = inject(Tasks);
  private readonly diskModel = inject(DiskModel);
  private readonly dialog = inject(MatDialog);

  /**
   * Record to hold the device manager for each device type.
   */
  private readonly managerRegistry: Record<DeviceType, IDeviceManager>;

  /**
   * Behavioral subject for information about the host device.
   */
  private readonly hostMetadataSubject = new BehaviorSubject<IDeviceMetadata>({});

  /**
   * Observable for information about the host device.
   */
  readonly hostMetadata: Observable<IDeviceMetadata> = this.hostMetadataSubject.pipe(map(metadata => structuredClone(metadata)));

  /**
   * Observable for all the devices for the application.
   */
  readonly devices: Observable<IDevice[]>;

  constructor() {
    // Define the manager registry and create a device list from each managers device observable
    this.managerRegistry = {
      [DeviceType.Tympan]: new TympanManager(),
      [DeviceType.Wahts]: new WahtsManager(),
      [DeviceType.Duodose]: new DuodoseManager(),
      [DeviceType.Svantek]: new SvantekManager(),
    };
    this.devices = combineLatest(Object.values(this.managerRegistry).map(m => m.devices)).pipe(map(devices => devices.flat()));
  }

  /**
   * Get the manager which handles the requests for a specific device type.
   * @param type The device type to use in determining the manager.
   * @returns The manager for the device type.
   */
  private getManager<T extends DeviceType>(type: T): IDeviceManager {
    return this.managerRegistry[type];
  }

  /**
   * Initialize the service, including network setup and saved device creation.
   */
  async initialize(): Promise<void> {
    await this.setupHostMetadata();
    await this.setupBleClient();
    // Add saved devices to the devices list
    (await firstValueFrom(this.diskModel.diskSubject)).savedDevices.forEach(savedDevice => {
      const newDevice = this.getManager(savedDevice.type).createDevice(savedDevice);
      // Known device, default to a known device state and the pre-existing tabsint id in case of user changes
      newDevice.tabsintId = savedDevice.tabsintId;
      newDevice.state = DeviceState.Disconnected;
      this.getManager(savedDevice.type).addDevice(newDevice);
    });
  }

  /**
   * Initialize the host metadata values.
   */
  private async setupHostMetadata() {
    try {
      const metadata: IDeviceMetadata = {};
      const info = await Device.getInfo();
      const batteryInfo = await Device.getBatteryInfo();
      const languageCode = await Device.getLanguageCode();
      const id = await Device.getId();
      metadata.build = info.manufacturer ?? 'Unknown';
      metadata.uuid = id.identifier;
      metadata.version = info.osVersion ?? 'Unknown';
      metadata.platform = info.platform ?? 'Unknown';
      metadata.model = info.model ?? 'Unknown';
      metadata.os = info.operatingSystem;
      metadata.other = `Battery level: ${batteryInfo.batteryLevel ?? 'Unknown'}, Language: ${languageCode.value ?? 'Unknown'}`;
      // TODO: Need to determine metadata.diskSpace following realDiskFree removal in Capacitor V7
      this.hostMetadataSubject.next(metadata);
      this.logger.debug('Device info processed -- \n' + JSON.stringify(metadata));
    } catch (err) {
      this.hostMetadataSubject.next({});
      this.logger.debug('Device info not available', err);
    }
  }

  /**
   * Initialize BLE capabilities and state monitoring.
   */
  private async setupBleClient() {
    try {
      await BleClient.initialize();
      this.stateModel.updateState({ bluetoothConnected: await BleClient.isEnabled() });
      await BleClient.startEnabledNotifications((enabled: boolean) => {
        this.stateModel.updateState({ bluetoothConnected: enabled });
      });
    } catch (err) {
      this.logger.error(`Failed to initialize BLE`, err);
    }
  }

  /**
   * Open a dialog used for selecting a new device to connect to.
   * @param deviceType The type of device the dialog should be opened for.
   * @returns A promise resolving to the device selected or undefined.
   */
  async deviceConnectionDialog(deviceType: DeviceType): Promise<IDevice | undefined> {
    return firstValueFrom(
      this.dialog
        .open(DeviceChooseComponent, { data: deviceType })
        .afterClosed()
        .pipe(
          concatMap(async (device: IDevice | undefined) => {
            if (device != undefined) {
              this.tasks.register('Connect Device', `Connecting to Device... `);
              try {
                await this.getManager(deviceType).connect(device);
                await this.saveDevice(device);
                await this.checkForFirmwareUpdate(device);
              } catch (err) {
                this.logger.debug('Device connection failed', err);
              }
              this.tasks.deregister('Connect Device');
            }
            return device;
          })
        )
    );
  }

  /**
   * Open a dialog used for reprogramming firmware on a device.
   * @param device The device to be reprogrammed.
   * @param text Optional content override for the dialog.
   */
  async reprogramFirmwareDialog(device: IDevice, text: string | undefined = undefined): Promise<void> {
    const msg: DialogDataInterface = {
      title: 'Confirm Firmware Update',
      content: text ?? 'Are you sure you want to update the firmware?',
      type: DialogType.Confirm,
    };
    this.notifications.alert(msg).subscribe(async (result: string) => {
      if (result === 'OK') {
        let completionResponse = 'The device is unavailable to reprogram.';
        if (device.state === DeviceState.Connected && device.status !== DeviceStatus.Busy) {
          const response = await this.reprogramFirmware(device);
          if (isValidDeviceResponse(response)) {
            const rebootResponse = await this.reboot(device);
            if (isValidDeviceResponse(rebootResponse)) {
              completionResponse = 'The device will now reboot. Reconnect the device to verify firmware was updated.';
            } else {
              completionResponse = 'The device failed to reboot automatically, please power cycle the device for the firmware update.';
            }
          }
        }
        this.notifications.alert({
          title: 'Alert',
          content: this.transloco.translate(completionResponse),
          type: DialogType.Alert,
        });
      }
    });
  }

  /**
   * Check if a device message is pending and alert the user if necessary.
   * @param device Connected device to check for a pending message.
   * @param alert Whether to push an alert to the user.
   * @returns Whether a message is pending or not.
   */
  isDeviceMessagePending(device: IDevice | undefined, alert = true): boolean {
    const pendingMsg = device?.status == DeviceStatus.Busy;
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

  /**
   * Get a connected device from the managed devices which has a tabsint identifier matching the provided input.
   * @param tabsintId The tabsint identifier of the device to find or undefined.
   * @param defaultTypes The types to find a default from.
   * @returns A promise resolving to the found device or first available device. If no devices available returns undefined.
   */
  async getDeviceOrDefault(tabsintId: string | undefined, defaultTypes: DeviceType[]): Promise<IDevice[]> {
    const devices = await firstValueFrom(this.devices);
    const availableDevices: IDevice[] = [];
    if (tabsintId !== undefined) {
      const foundDevices = devices.filter(device => defaultTypes.includes(device.type) && device.state === DeviceState.Connected);
      const device = foundDevices.find(device => device.tabsintId == tabsintId);
      if (device) {
        availableDevices.push(structuredClone(device));
      }
    } else {
      const foundDevices = devices.filter(device => defaultTypes.includes(device.type) && device.state === DeviceState.Connected);
      foundDevices.forEach(dev => {
        availableDevices.push(structuredClone(dev));
      });
    }
    return availableDevices;
  }

  /**
   * Produce an error for when the device is not found.
   */
  async deviceNotFound() {
    const resp = ['0', 'ERROR', 'Default device not found. Make sure a supported device is connected and try again.'];
    this.stateModel.updateState({ examState: ExamState.DeviceError });
    this.stateModel.updateState({ deviceError: resp });
  }

  /**
   * Produce an error for when multiple devices are found.
   */
  async multipleDevicesFound() {
    const resp = [
      '0',
      'ERROR',
      'Multiple devices found. TabSINT is not sure which device exam should run on. \
      Please see TabSINT.org for more information about using TabSINT with multiple devices.',
    ];
    this.stateModel.updateState({ examState: ExamState.DeviceError });
    this.stateModel.updateState({ deviceError: resp });
  }

  /**
   * Produce an error for when multiple devices are found (more than 1).
   */
  async confirmSingleDevice(deviceList: IDevice[]): Promise<IDevice | undefined> {
    if (deviceList.length === 0) {
      await this.deviceNotFound();
      this.logger.error('Error setting up exam - no device found.');
      return;
    } else if (deviceList.length >= 2) {
      await this.multipleDevicesFound();
      this.logger.error('Error setting up exam - multiple devices found.');
      return;
    } else {
      return deviceList[0];
    }
  }

  /**
   * Produce an error for when the device is handling previous messages.
   */
  async deviceMessagePendingError() {
    const resp = ['0', 'ERROR', 'Device is currently handling previous messages, wait until completion to try again.'];
    this.stateModel.updateState({ examState: ExamState.DeviceError });
    this.stateModel.updateState({ deviceError: resp });
  }

  /**
   * Remove a saved device from the disk.
   * @param device The device to be removed.
   */
  async removeSavedDevice(device: IDevice): Promise<void> {
    this.getManager(device.type).removeDevice(device);
    let savedDevices = structuredClone((await firstValueFrom(this.diskModel.diskSubject)).savedDevices);
    savedDevices = savedDevices.filter(dev => dev.deviceId != device.deviceId);
    this.diskModel.updateDiskModel({ savedDevices: savedDevices });
  }

  /**
   * Save a device to the disk.
   * @param device The device to be added.
   */
  async saveDevice(device: SavedDevice): Promise<void> {
    let savedDevices = structuredClone((await firstValueFrom(this.diskModel.diskSubject)).savedDevices);
    savedDevices = savedDevices.filter(dev => dev.deviceId != device.deviceId);
    savedDevices.push(device);
    this.diskModel.updateDiskModel({ savedDevices: savedDevices });
  }

  /**
   * Start a device search to retrieve available devices for the specified device type.
   * @param deviceType The type of device the search should be started for.
   */
  async startDeviceSearch(deviceType: DeviceType): Promise<void> {
    return this.getManager(deviceType).startDeviceSearch();
  }

  /**
   * Stop an ongoing device search.
   */
  async stopDeviceSearch(deviceType: DeviceType): Promise<void> {
    return this.getManager(deviceType).stopDeviceSearch();
  }

  /**
   * Set the TabSINT identifier for the provided device.
   * @param device The device whose matching reference should be updated.
   * @param id The new TabSINT identifier for the device.
   */
  async setTabsintId(device: IDevice, id: string): Promise<void> {
    const devices = await firstValueFrom(this.devices);
    if (!devices.some(dev => dev.tabsintId === id)) {
      this.getManager(device.type).setTabsintId(device, id);
      let savedDevices = structuredClone((await firstValueFrom(this.diskModel.diskSubject)).savedDevices);
      savedDevices = savedDevices.map(dev => (dev.deviceId === device.deviceId ? { ...dev, tabsintId: id } : dev));
      this.diskModel.updateDiskModel({ savedDevices: savedDevices });
    }
  }

  /**
   * Connect to the device.
   * @param device The device to be connected to.
   */
  async connect(device: IDevice): Promise<void> {
    return this.getManager(device.type).connect(device);
  }

  /**
   * Disconnect from the device.
   * @param device The device to be disconnected from.
   */
  async disconnect(device: IDevice): Promise<void> {
    return this.getManager(device.type).disconnect(device);
  }

  /**
   * Request a device identifier.
   * @param device The device to request the identifier from.
   */
  async requestId(device: IDevice): Promise<IDeviceResponse | undefined> {
    return this.getManager(device.type).requestId?.(device);
  }

  /**
   * Request the status of a device.
   * @param device The device to request status from.
   */
  async requestStatus(device: IDevice): Promise<IDeviceResponse | undefined> {
    return this.getManager(device.type).requestStatus?.(device);
  }

  /**
   * Request the setting of a device.
   * @param device The device to request the setting from.
   * @param setting The setting to be requested.
   */
  async requestSetting(device: IDevice, setting: string): Promise<IDeviceResponse | undefined> {
    return this.getManager(device.type).requestSetting?.(device, setting);
  }

  /**
   * Write the setting of a device.
   * @param device The device to request the setting from.
   * @param setting The setting to be written.
   * @param value The value of the setting to be written
   */
  async writeSetting(device: IDevice, setting: string, value: number): Promise<IDeviceResponse | undefined> {
    return this.getManager(device.type).writeSetting?.(device, setting, value);
  }

  /**
   * Queue an exam for a device.
   * @param device The device to queue the exam for.
   * @param examId The identifier of the exam to be queued.
   * @param examProperties Object holding properties related to the exam.
   */
  async queueExam(device: IDevice, examId: string, examProperties: object): Promise<IDeviceResponse | undefined> {
    return this.getManager(device.type).queueExam?.(device, examId, examProperties);
  }

  /**
   * Submit an exam submission for a device.
   * @param device The device which the submission will be sent to.
   * @param examProperties Object holding properties related to the exam.
   * @param ignoreErrors A list of keywords for which matching errors will be ignored.
   */
  async examSubmission(device: IDevice, examProperties: object, ignoreErrors: string[] = []): Promise<IDeviceResponse | undefined> {
    return this.getManager(device.type).examSubmission?.(device, examProperties, ignoreErrors);
  }

  /**
   * Abort an exam for a device.
   * @param device The device to abort the exam for.
   */
  async abortExams(device: IDevice): Promise<IDeviceResponse | undefined> {
    return this.getManager(device.type).abortExams?.(device);
  }

  /**
   * Request results from an exam for a device.
   * @param device The device to request exam results from.
   * @param timeoutMs How long to wait for the results response before giving up.
   */
  async requestResults(device: IDevice, timeoutMs?: number): Promise<IDeviceResponse | undefined> {
    return this.getManager(device.type).requestResults?.(device, timeoutMs);
  }

  /**
   * Set the state of the software response button for a device.
   * @param device The device to set the software button state for.
   * @param state The new state of the software button (0 or 1).
   */
  async setSoftwareButtonState(device: IDevice, state: number): Promise<IDeviceResponse | undefined> {
    return this.getManager(device.type).setSoftwareButtonState?.(device, state);
  }

  /**
   * Start playback of masking noise on a device.
   * @param device The device to start the masking noise on.
   * @param maskingNoise The masking noise configuration.
   */
  async startMaskingNoise(device: IDevice, maskingNoise: MaskingNoise): Promise<IDeviceResponse | undefined> {
    return this.getManager(device.type).startMaskingNoise?.(device, maskingNoise);
  }

  /**
   * Stop playback of masking noise on a device.
   * @param device The device to stop the masking noise on.
   */
  async stopMaskingNoise(device: IDevice): Promise<IDeviceResponse | undefined> {
    return this.getManager(device.type).stopMaskingNoise?.(device);
  }

  /**
   * Reprogram the firmware for a device.
   * @param device The device to reprogram.
   * @returns The device response for the reprogram request or undefined.
   */
  async reprogramFirmware(device: IDevice): Promise<IDeviceResponse | undefined> {
    return this.getManager(device.type).reprogramFirmware?.(device);
  }

  /**
   * Reboot the device.
   * @param device The device to reboot.
   * @returns The device response for the reboot request or undefined.
   */
  async reboot(device: IDevice): Promise<IDeviceResponse | undefined> {
    return this.getManager(device.type).reboot?.(device);
  }

  /**
   * Get the available application firmware for a device.
   * @param deviceType The device type associated with the firmware.
   * @returns The firmware asset provided by the application for the managed device type.
   */
  async getApplicationFirmware(deviceType: DeviceType): Promise<FirmwareAsset | undefined> {
    return this.getManager(deviceType).getApplicationFirmware?.();
  }

  /**
   * Get the available space for a device (DuoDose only?).
   * @param device The device to get available remaining space from.
   * @returns The amount of space remaining on the device.
   */
  async requestSdBytesFree(device: IDevice): Promise<IDeviceResponse | undefined> {
    return this.getManager(device.type).requestSdBytesFree?.(device);
  }

  /**
   * Get the directory long names from a device (DuoDose only?).
   * @param device The device to get the directory long names from.
   * @param baseDir The dir to get the directory long names from.
   * @returns The directory long names from the device.
   */
  async getDirectoryLongNames(device: IDevice, baseDir: string): Promise<IDeviceResponse | undefined> {
    return this.getManager(device.type).getDirectoryLongNames?.(device, baseDir);
  }

  /**
   * Copy file from device onto tablet (DuoDose only?).
   * @param device The device to copy the file from.
   * @param fileToRead The file to copy.
   * @returns Success or error.
   */
  async copyChaFileToLocalStorageAndReadFile(device: IDevice, fileToRead: string): Promise<IDeviceResponse | undefined> {
    return this.getManager(device.type).copyChaFileToLocalStorageAndReadFile?.(device, fileToRead);
  }

  /**
   * Read the file copied from a device (DuoDose only?).
   * @param device The device to read the file from.
   * @param fileToRead The file to read.
   * @returns The text of the file.
   */
  async readCopiedChaFile(device: IDevice, fileToRead: string): Promise<IDeviceResponse | undefined> {
    return this.getManager(device.type).readCopiedChaFile?.(device, fileToRead);
  }

  /**
   * Prompt the user to update firmware on a device if the bundled version differs from the device's version.
   * @param device The device to check firmware for.
   */
  async checkForFirmwareUpdate(device: IDevice): Promise<void> {
    const disk = await firstValueFrom(this.diskModel.diskSubject);
    const firmwareAsset = await this.getApplicationFirmware(device.type);
    if (
      !disk.preferences.ignoreFirmwareUpdates &&
      device.metadata.buildDateTime &&
      firmwareAsset?.buildDatetime &&
      Date.parse(device.metadata.buildDateTime) !== Date.parse(firmwareAsset.buildDatetime)
    ) {
      const msg: DialogDataInterface = {
        title: 'Firmware Update',
        content: `
          The firmware on device ${device.deviceId} is not supported by this TabSINT version.
          This TabSINT version supports ${firmwareAsset.version} firmware.
          Select 'OK' to update the firmware on ${device.deviceId}.
          The firmware can also be updated through the device information panel.
        `,
        type: DialogType.Confirm,
      };
      this.notifications.alert(msg).subscribe(async result => {
        if (result === 'OK') {
          await this.reprogramFirmwareDialog(device);
        }
      });
    }
  }

  /**
   * Disconnect all WAHTS devices that don't match the new connection type, then update the preference.
   * @param connectionType The new WAHTS connection type to switch to.
   */
  async changeChaConnectionType(connectionType: BluetoothType): Promise<void> {
    const devices = await firstValueFrom(this.devices);
    const toDisconnect = devices.filter(d => d.type === DeviceType.Wahts && (d as IWahtsDevice).connectionType !== connectionType);
    for (const device of toDisconnect) {
      if (device.state !== DeviceState.Disconnected) {
        await this.disconnect(device);
      }
    }
    this.diskModel.updatePreferences({ wahtsConnectionType: connectionType });
  }

  /**
   * Function to change device values.
   * @param device The device with property changes to be updated.
   */
  async updateDeviceConnectionType(device: IDevice, connectionType: BluetoothType): Promise<void> {
    this.getManager(device.type).updateDeviceConnectionType?.(device, connectionType);
    let savedDevices = structuredClone((await firstValueFrom(this.diskModel.diskSubject)).savedDevices);
    savedDevices = savedDevices.map(dev => (dev.deviceId === device.deviceId ? { ...dev, connectionType } : dev));
    this.diskModel.updateDiskModel({ savedDevices });
  }

  /**
   * Transfer directory content to a device.
   * @param device The device to transfer files to.
   * @param localDirectory The directory to transfer files from recursively.
   * @param remoteDirectory The directory to transfer the files to.
   * @returns The device response for the request or undefined.
   */
  async transferDirectory(device: IDevice, localDirectory: string, remoteDirectory: string): Promise<IDeviceResponse | undefined> {
    return this.getManager(device.type).transferDirectory?.(device, localDirectory, remoteDirectory);
  }
  /**
   * Cancel any ongoing file operation.
   * @param device The device to cancel the file operation on.
   * @returns The device response for the request or undefined.
   */
  async cancelFileOperation(device: IDevice): Promise<IDeviceResponse | undefined> {
    return this.getManager(device.type).cancelFileOperation?.(device);
  }

  /**
   * Start recording from a Svantek dosimeter.
   * @param device The Svantek device to start recording on.
   */
  async startRecording(device: ISvantekDevice): Promise<void> {
    return this.getManager(device.type).startRecording?.(device);
  }

  /**
   * Stop recording from a Svantek dosimeter.
   * @param device The Svantek device to stop recording on.
   */
  async stopRecording(device: ISvantekDevice): Promise<void> {
    return this.getManager(device.type).stopRecording?.(device);
  }

  /**
   * Return the latest measurement result captured during the current recording session.
   * @param device The Svantek device to retrieve the result for.
   */
  getSvantekResult(device: ISvantekDevice): SvantekResultInterface | undefined {
    return (this.managerRegistry[DeviceType.Svantek] as SvantekManager).getSvantekResult(device);
  }
}
