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

  /**
   * Behavioral subject for the device type which currently owns the single, app-wide device search.
   */
  private readonly activeScanTypeSubject = new BehaviorSubject<DeviceType | undefined>(undefined);

  /**
   * Observable for the device type which currently owns the single, app-wide device search.
   */
  readonly activeScanType: Observable<DeviceType | undefined> = this.activeScanTypeSubject.asObservable();

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
   * Get the current device for a given identifier as an observable.
   * @param deviceId The identifier of the device to resolve.
   * @returns The current device observable for that identifier, or undefined if it isn't tracked.
   */
  getDeviceById$(deviceId: string): Observable<IDevice | undefined> {
    return this.devices.pipe(map(devices => devices.find(d => d.deviceId === deviceId)));
  }

  /**
   * One-shot fetch of the current device for a given identifier.
   * Do not use this unless an observable will not work.
   * @param deviceId The identifier of the device to resolve.
   * @returns The current device for that identifier, or undefined if it isn't tracked.
   */
  async getDeviceById(deviceId: string): Promise<IDevice | undefined> {
    return firstValueFrom(this.getDeviceById$(deviceId));
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
      // metadata.diskSpace is left unset: @capacitor/device exposes no disk API since realDiskFree
      // was removed, so populating it needs a native getFreeDiskSpace() added to the tabsintfs
      // plugin. Legacy TabSINT reported free space in MB and warned operators below 200 MB.
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
              const connectTask = `Connect Device: ${device.tabsintId}`;
              this.tasks.register(connectTask, `Connecting to Device... `);
              try {
                await this.connect(device.deviceId);
                await this.saveDevice(device);
                await this.checkForFirmwareUpdate(device.deviceId);
              } catch (err) {
                this.logger.debug('Device connection failed', err);
                this.notifications
                  .alert({
                    title: 'Connection Failed',
                    content: `Failed to connect to ${device.tabsintId}.`,
                    type: DialogType.Alert,
                  })
                  .subscribe();
              }
              this.tasks.deregister(connectTask);
            }
            return device;
          })
        )
    );
  }

  /**
   * Open a dialog used for reprogramming firmware on a device.
   * @param deviceId The identifier of the device to be reprogrammed.
   * @param text Optional content override for the dialog.
   */
  async reprogramFirmwareDialog(deviceId: string, text: string | undefined = undefined): Promise<void> {
    const msg: DialogDataInterface = {
      title: 'Confirm Firmware Update',
      content: text ?? 'Are you sure you want to update the firmware?',
      type: DialogType.Confirm,
    };
    this.notifications.alert(msg).subscribe(async (result: string) => {
      if (result === 'OK') {
        const device = await this.getDeviceById(deviceId);
        let completionResponse = 'The device is unavailable to reprogram.';
        if (device?.state === DeviceState.Connected && device.status !== DeviceStatus.Busy) {
          const response = await this.reprogramFirmware(deviceId);
          if (isValidDeviceResponse(response)) {
            const rebootResponse = await this.reboot(deviceId);
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
   * @param deviceId The identifier of the device to check for a pending message.
   * @param alert Whether to push an alert to the user.
   * @returns Whether a message is pending or not.
   */
  async isDeviceMessagePending(deviceId: string | undefined, alert = true): Promise<boolean> {
    const device = deviceId ? await this.getDeviceById(deviceId) : undefined;
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
   * Get a connected device identifier from the managed devices which has a tabsint identifier matching the provided input.
   * @param tabsintId The tabsint identifier of the device to find or undefined.
   * @param defaultTypes The types to find a default from.
   * @returns A promise resolving to the found device identifier or first available device identifier. If no devices available returns undefined.
   */
  async getDeviceIdOrDefault(tabsintId: string | undefined, defaultTypes: DeviceType[]): Promise<string[]> {
    const devices = await firstValueFrom(this.devices);
    const useDefaults = tabsintId === undefined;
    return devices
      .filter(
        device =>
          device.state === DeviceState.Connected &&
          ((useDefaults && defaultTypes.includes(device.type)) || (!useDefaults && tabsintId === device.tabsintId))
      )
      .map(device => device.deviceId);
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
   * Resolve the identifier of the single connected device matching a tabsintId or default.
   * Alerts the user when zero or multiple devices are found.
   * @param tabsintId The tabsint identifier of the device to find or undefined.
   * @param defaultTypes The types to find a default from.
   * @returns The identifier of the resolved device, or undefined if none was found.
   */
  async confirmSingleDeviceId(tabsintId: string | undefined, defaultTypes: DeviceType[]): Promise<string | undefined> {
    const deviceIds = await this.getDeviceIdOrDefault(tabsintId, defaultTypes);
    if (deviceIds.length === 0) {
      await this.deviceNotFound();
      this.logger.error('Error setting up exam - no device found.');
      return undefined;
    } else if (deviceIds.length >= 2) {
      await this.multipleDevicesFound();
      this.logger.error('Error setting up exam - multiple devices found.');
      return undefined;
    } else {
      return deviceIds[0];
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
   * @param deviceId The identifier of the device to be removed.
   */
  async removeSavedDevice(deviceId: string): Promise<void> {
    const device = await this.getDeviceById(deviceId);
    if (!device) {
      return;
    }
    this.getManager(device.type).removeDevice(device);
    let savedDevices = structuredClone((await firstValueFrom(this.diskModel.diskSubject)).savedDevices);
    savedDevices = savedDevices.filter(dev => dev.deviceId != deviceId);
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
   * Only one device search may be active at a time app-wide, since the underlying native scans
   * (CHA plugin, BLE) are each a single shared resource rather than one per device type.
   * @param deviceType The type of device the search should be started for.
   */
  async startDeviceSearch(deviceType: DeviceType): Promise<void> {
    const activeType = this.activeScanTypeSubject.getValue();
    if (activeType !== undefined) {
      throw new Error(`Cannot start a device search while another search is in progress.`);
    }
    this.activeScanTypeSubject.next(deviceType);
    try {
      await this.getManager(deviceType).startDeviceSearch();
    } catch (err) {
      this.activeScanTypeSubject.next(undefined);
      throw err;
    }
  }

  /**
   * Stop an ongoing device search. A no-op unless this device type currently owns the search.
   * The native scans backing each manager (CHA plugin, BLE) are shared resources, not one per
   * device type, so calling stop for a type that isn't the current owner could otherwise cancel
   * a different, unrelated device's search. The lock is always released if this type owns it,
   * even if the manager fails to stop cleanly, so a failure here can't permanently block every
   * future search.
   * @param deviceType The type of device the search should be stopped for.
   */
  async stopDeviceSearch(deviceType: DeviceType): Promise<void> {
    if (this.activeScanTypeSubject.getValue() !== deviceType) {
      return;
    }
    try {
      await this.getManager(deviceType).stopDeviceSearch();
    } finally {
      this.activeScanTypeSubject.next(undefined);
    }
  }

  /**
   * Set the TabSINT identifier for the provided device.
   * @param deviceId The identifier of the device to update.
   * @param id The new TabSINT identifier for the device.
   */
  async setTabsintId(deviceId: string, id: string): Promise<void> {
    const devices = await firstValueFrom(this.devices);
    const device = devices.find(dev => dev.deviceId === deviceId);
    if (!device) {
      return;
    }
    if (!devices.some(dev => dev.tabsintId === id)) {
      this.getManager(device.type).setTabsintId(device, id);
      let savedDevices = structuredClone((await firstValueFrom(this.diskModel.diskSubject)).savedDevices);
      savedDevices = savedDevices.map(dev => (dev.deviceId === deviceId ? { ...dev, tabsintId: id } : dev));
      this.diskModel.updateDiskModel({ savedDevices: savedDevices });
    }
  }

  /**
   * Connect to the device.
   * @param deviceId The identifier of the device to be connected to.
   */
  async connect(deviceId: string): Promise<void> {
    const device = await this.getDeviceById(deviceId);
    if (!device) {
      throw new Error(`Connect: no device found for id ${deviceId}`);
    }
    return this.getManager(device.type).connect(device);
  }

  /**
   * Disconnect from the device.
   * @param deviceId The identifier of the device to be disconnected from.
   */
  async disconnect(deviceId: string): Promise<void> {
    const device = await this.getDeviceById(deviceId);
    if (!device) {
      throw new Error(`Disconnect: no device found for id ${deviceId}`);
    }
    return this.getManager(device.type).disconnect(device);
  }

  /**
   * Request a device identifier.
   * @param deviceId The identifier of the device to request the identifier from.
   */
  async requestId(deviceId: string): Promise<IDeviceResponse | undefined> {
    const device = await this.getDeviceById(deviceId);
    if (!device) {
      return undefined;
    }
    return this.getManager(device.type).requestId?.(device);
  }

  /**
   * Request the status of a device.
   * @param deviceId The identifier of the device to request status from.
   */
  async requestStatus(deviceId: string): Promise<IDeviceResponse | undefined> {
    const device = await this.getDeviceById(deviceId);
    if (!device) {
      return undefined;
    }
    return this.getManager(device.type).requestStatus?.(device);
  }

  /**
   * Request the setting of a device.
   * @param deviceId The identifier of the device to request the setting from.
   * @param setting The setting to be requested.
   */
  async requestSetting(deviceId: string, setting: string): Promise<IDeviceResponse | undefined> {
    const device = await this.getDeviceById(deviceId);
    if (!device) {
      return undefined;
    }
    return this.getManager(device.type).requestSetting?.(device, setting);
  }

  /**
   * Write the setting of a device.
   * @param deviceId The identifier of the device to request the setting from.
   * @param setting The setting to be written.
   * @param value The value of the setting to be written
   */
  async writeSetting(deviceId: string, setting: string, value: number): Promise<IDeviceResponse | undefined> {
    const device = await this.getDeviceById(deviceId);
    if (!device) {
      return undefined;
    }
    return this.getManager(device.type).writeSetting?.(device, setting, value);
  }

  /**
   * Queue an exam for a device.
   * @param deviceId The identifier of the device to queue the exam for.
   * @param examId The identifier of the exam to be queued.
   * @param examProperties Object holding properties related to the exam.
   */
  async queueExam(deviceId: string, examId: string, examProperties: object): Promise<IDeviceResponse | undefined> {
    const device = await this.getDeviceById(deviceId);
    if (!device) {
      return undefined;
    }
    return this.getManager(device.type).queueExam?.(device, examId, examProperties);
  }

  /**
   * Submit an exam submission for a device.
   * @param deviceId The identifier of the device which the submission will be sent to.
   * @param examProperties Object holding properties related to the exam.
   * @param ignoreErrors A list of keywords for which matching errors will be ignored.
   */
  async examSubmission(deviceId: string, examProperties: object, ignoreErrors: string[] = []): Promise<IDeviceResponse | undefined> {
    const device = await this.getDeviceById(deviceId);
    if (!device) {
      return undefined;
    }
    return this.getManager(device.type).examSubmission?.(device, examProperties, ignoreErrors);
  }

  /**
   * Abort an exam for a device.
   * @param deviceId The identifier of the device to abort the exam for.
   */
  async abortExams(deviceId: string): Promise<IDeviceResponse | undefined> {
    const device = await this.getDeviceById(deviceId);
    if (!device) {
      return undefined;
    }
    return this.getManager(device.type).abortExams?.(device);
  }

  /**
   * Request results from an exam for a device.
   * @param deviceId The identifier of the device to request exam results from.
   * @param timeoutMs How long to wait for the results response before giving up.
   */
  async requestResults(deviceId: string, timeoutMs?: number): Promise<IDeviceResponse | undefined> {
    const device = await this.getDeviceById(deviceId);
    if (!device) {
      return undefined;
    }
    return this.getManager(device.type).requestResults?.(device, timeoutMs);
  }

  /**
   * Set the state of the software response button for a device.
   * @param deviceId The identifier of the device to set the software button state for.
   * @param state The new state of the software button (0 or 1).
   */
  async setSoftwareButtonState(deviceId: string, state: number): Promise<IDeviceResponse | undefined> {
    const device = await this.getDeviceById(deviceId);
    if (!device) {
      return undefined;
    }
    return this.getManager(device.type).setSoftwareButtonState?.(device, state);
  }

  /**
   * Start playback of masking noise on a device.
   * @param deviceId The identifier of the device to start the masking noise on.
   * @param maskingNoise The masking noise configuration.
   */
  async startMaskingNoise(deviceId: string, maskingNoise: MaskingNoise): Promise<IDeviceResponse | undefined> {
    const device = await this.getDeviceById(deviceId);
    if (!device) {
      return undefined;
    }
    return this.getManager(device.type).startMaskingNoise?.(device, maskingNoise);
  }

  /**
   * Stop playback of masking noise on a device.
   * @param deviceId The identifier of the device to stop the masking noise on.
   */
  async stopMaskingNoise(deviceId: string): Promise<IDeviceResponse | undefined> {
    const device = await this.getDeviceById(deviceId);
    if (!device) {
      return undefined;
    }
    return this.getManager(device.type).stopMaskingNoise?.(device);
  }

  /**
   * Reprogram the firmware for a device.
   * @param deviceId The identifier of the device to reprogram.
   * @returns The device response for the reprogram request or undefined.
   */
  async reprogramFirmware(deviceId: string): Promise<IDeviceResponse | undefined> {
    const device = await this.getDeviceById(deviceId);
    if (!device) {
      return undefined;
    }
    return this.getManager(device.type).reprogramFirmware?.(device);
  }

  /**
   * Reboot the device.
   * @param deviceId The identifier of the device to reboot.
   * @returns The device response for the reboot request or undefined.
   */
  async reboot(deviceId: string): Promise<IDeviceResponse | undefined> {
    const device = await this.getDeviceById(deviceId);
    if (!device) {
      return undefined;
    }
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
   * @param deviceId The identifier of the device to get available remaining space from.
   * @returns The amount of space remaining on the device.
   */
  async requestSdBytesFree(deviceId: string): Promise<IDeviceResponse | undefined> {
    const device = await this.getDeviceById(deviceId);
    if (!device) {
      return undefined;
    }
    return this.getManager(device.type).requestSdBytesFree?.(device);
  }

  /**
   * List files in a directory on a device (DuoDose only?).
   * @param device The device to list the directory from.
   * @param baseDir The directory to list.
   * @returns The directory listing from the device.
   */
  async getDirectory(device: IDevice, baseDir: string): Promise<IDeviceResponse | undefined> {
    return this.getManager(device.type).getDirectory?.(device, baseDir);
  }

  /**
   * Get the long name of a file on a device from its short name (DuoDose only?).
   * @param device The device to get the long file name from.
   * @param shortName The short name of the file.
   * @returns The long name of the file.
   */
  async getChaLongName(device: IDevice, shortName: string): Promise<IDeviceResponse | undefined> {
    return this.getManager(device.type).getChaLongName?.(device, shortName);
  }

  /**
   * Copy file from device onto tablet (DuoDose only?).
   * @param deviceId The identifier of the device to copy the file from.
   * @param fileToRead The file to copy.
   * @returns Success or error.
   */
  async copyChaFileToLocalStorageAndReadFile(deviceId: string, fileToRead: string): Promise<IDeviceResponse | undefined> {
    const device = await this.getDeviceById(deviceId);
    if (!device) {
      return undefined;
    }
    return this.getManager(device.type).copyChaFileToLocalStorageAndReadFile?.(device, fileToRead);
  }

  /**
   * Read the file copied from a device (DuoDose only?).
   * @param deviceId The identifier of the device to read the file from.
   * @param fileToRead The file to read.
   * @returns The text of the file.
   */
  async readCopiedChaFile(deviceId: string, fileToRead: string): Promise<IDeviceResponse | undefined> {
    const device = await this.getDeviceById(deviceId);
    if (!device) {
      return undefined;
    }
    return this.getManager(device.type).readCopiedChaFile?.(device, fileToRead);
  }

  /**
   * Prompt the user to update firmware on a device if the bundled version differs from the device's version.
   * @param deviceId The identifier of the device to check firmware for.
   */
  async checkForFirmwareUpdate(deviceId: string): Promise<void> {
    const device = await this.getDeviceById(deviceId);
    if (!device || device.name.toLowerCase().includes('oaesp')) {
      return;
    }
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
          The firmware can also be updated through the device details panel.
        `,
        type: DialogType.Confirm,
      };
      this.notifications.alert(msg).subscribe(async result => {
        if (result === 'OK') {
          await this.reprogramFirmwareDialog(deviceId);
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
        await this.disconnect(device.deviceId);
      }
    }
    this.diskModel.updatePreferences({ wahtsConnectionType: connectionType });
  }

  /**
   * Function to change device values.
   * @param deviceId The identifier of the device to be updated.
   * @param connectionType The new connectionType identifier for the device.
   */
  async updateDeviceConnectionType(deviceId: string, connectionType: BluetoothType): Promise<void> {
    const device = await this.getDeviceById(deviceId);
    if (!device) {
      return;
    }
    this.getManager(device.type).updateDeviceConnectionType?.(device, connectionType);
    let savedDevices = structuredClone((await firstValueFrom(this.diskModel.diskSubject)).savedDevices);
    savedDevices = savedDevices.map(dev => (dev.deviceId === deviceId ? { ...dev, connectionType } : dev));
    this.diskModel.updateDiskModel({ savedDevices });
  }

  /**
   * Transfer directory content to a device.
   * @param deviceId The identifier of the device to transfer files to.
   * @param localDirectory The directory to transfer files from recursively.
   * @param remoteDirectory The directory to transfer the files to.
   * @returns The device response for the request or undefined.
   */
  async transferDirectory(deviceId: string, localDirectory: string, remoteDirectory: string): Promise<IDeviceResponse | undefined> {
    const device = await this.getDeviceById(deviceId);
    if (!device) {
      return undefined;
    }
    return this.getManager(device.type).transferDirectory?.(device, localDirectory, remoteDirectory);
  }
  /**
   * Cancel any ongoing file operation.
   * @param deviceId The identifier of the device to cancel the file operation on.
   * @returns The device response for the request or undefined.
   */
  async cancelFileOperation(deviceId: string): Promise<IDeviceResponse | undefined> {
    const device = await this.getDeviceById(deviceId);
    if (!device) {
      return undefined;
    }
    return this.getManager(device.type).cancelFileOperation?.(device);
  }

  /**
   * Start recording from a Svantek dosimeter.
   * @param deviceId The identifier of the Svantek device to start recording on.
   */
  async startRecording(deviceId: string): Promise<void> {
    const device = await this.getDeviceById(deviceId);
    if (!device) {
      return;
    }
    return this.getManager(DeviceType.Svantek).startRecording?.(device);
  }

  /**
   * Stop recording from a Svantek dosimeter.
   * @param deviceId The identifier of the Svantek device to stop recording on.
   */
  async stopRecording(deviceId: string): Promise<void> {
    const device = await this.getDeviceById(deviceId);
    if (!device) {
      return;
    }
    return this.getManager(DeviceType.Svantek).stopRecording?.(device);
  }

  /**
   * Return the latest measurement result captured during the current recording session.
   * @param deviceId The identifier of the Svantek device to retrieve the result for.
   */
  async getSvantekResult(deviceId: string): Promise<SvantekResultInterface | undefined> {
    const device = await this.getDeviceById(deviceId);
    if (!device) {
      return undefined;
    }
    return (this.managerRegistry[DeviceType.Svantek] as SvantekManager).getSvantekResult(device);
  }
}
