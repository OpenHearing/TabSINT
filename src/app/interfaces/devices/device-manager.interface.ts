import { Observable } from 'rxjs';
import { IDevice } from './device.interface';
import { IDeviceResponse } from './device-response.interface';
import { SavedDevice } from '../../models/disk/disk.interface';
import { FirmwareAsset } from '../firmware-asset.interface';
import { BluetoothType } from '../../utilities/constants';
import { MaskingNoise } from '../../views/response-area/response-areas/shared/audiometry/audiometry.interface';

/**
 * Device Manager Interface.
 * Used for managing all devices of a specific type.
 */
export interface IDeviceManager {
  /**
   * Observable device list handled by the manager.
   */
  readonly devices: Observable<IDevice[]>;

  /**
   * Create a device from a saved device object.
   * This method is implemented to convert devices saved in local storage into useable devices.
   * @param savedDevice The saved device used to instantiate a useable device from.
   */
  createDevice(savedDevice: SavedDevice): IDevice;

  /**
   * Add a device to the devices list.
   * @param device The device to be added.
   */
  addDevice(device: IDevice): void;

  /**
   * Remove a device from the device list.
   * @param device The device to be removed.
   */
  removeDevice(device: IDevice): void;

  /**
   * Set the TabSINT identifier for the provided device in the device list.
   * @param device The device whose matching reference in the device list should be updated.
   * @param id The new TabSINT identifier for the device.
   */
  setTabsintId(device: IDevice, id: string): void;

  /**
   * Set the connectionType identifier for the provided device in the device list.
   * @param device The device whose matching reference in the device list should be updated.
   * @param connectionType The new connectionType identifier for the device.
   */
  updateDeviceConnectionType?(device: IDevice, connectionType: BluetoothType): void;

  /**
   * Connect to the device.
   * @param device The device to be connected to.
   */
  connect(device: IDevice): Promise<void>;

  /**
   * Disconnect from the device.
   * @param device The device to be disconnected from.
   */
  disconnect(device: IDevice): Promise<void>;

  /**
   * Start a device search to retrieve available devices and update the device list.
   */
  startDeviceSearch(): Promise<void>;

  /**
   * Stop an ongoing device search.
   */
  stopDeviceSearch(): Promise<void>;

  /**
   * Optional method to request a device identifier.
   * @param device The device to request the identifier from.
   */
  requestId?(device: IDevice): Promise<IDeviceResponse>;

  /**
   * Optional method to request a device identifier.
   * @param device The device to request the identifier from.
   */
  requestStatus?(device: IDevice): Promise<IDeviceResponse>;

  /**
   * Optional method to queue an exam for a device.
   * @param device The device to queue the exam for.
   * @param examId The identifier of the exam to be queued.
   * @param examProperties Object holding properties related to the exam.
   */
  queueExam?(device: IDevice, examId: string, examProperties: object): Promise<IDeviceResponse>;

  /**
   * Optional method to submit an exam submission for a device.
   * @param device The device which the submission will be sent to.
   * @param examProperties Object holding properties related to the exam.
   * @param ignoreErrors A list of keywords for which matching errors will be ignored.
   */
  examSubmission?(device: IDevice, examProperties: object, ignoreErrors: string[]): Promise<IDeviceResponse>;

  /**
   * Optional method to abort an exam for a device.
   * @param device The device to abort the exam for.
   */
  abortExams?(device: IDevice): Promise<IDeviceResponse>;

  /**
   * Optional method to request results from an exam for a device.
   * @param device The device to request exam results from.
   * @param timeoutMs How long to wait for the results response before giving up.
   */
  requestResults?(device: IDevice, timeoutMs?: number): Promise<IDeviceResponse>;

  /**
   * Optional method to reprogram the firmware for a device.
   * @param device The device to reprogram.
   * @returns The device response for the reprogram request.
   */
  reprogramFirmware?(device: IDevice): Promise<IDeviceResponse>;

  /**
   * Optional method to reboot a device.
   * @param device The device to reboot.
   * @returns The device response for the reboot request or undefined.
   */
  reboot?(device: IDevice): Promise<IDeviceResponse | undefined>;

  /**
   * Optional method to set the state of the software response button for a device.
   * @param device The device to set the software button state for.
   * @param state The new state of the software button (0 or 1).
   * @returns The device response for the request or undefined.
   */
  setSoftwareButtonState?(device: IDevice, state: number): Promise<IDeviceResponse | undefined>;

  /**
   * Optional method to start playback of masking noise on a device.
   * @param device The device to start the masking noise on.
   * @param maskingNoise The masking noise configuration.
   * @returns The device response for the request or undefined.
   */
  startMaskingNoise?(device: IDevice, maskingNoise: MaskingNoise): Promise<IDeviceResponse | undefined>;

  /**
   * Optional method to stop playback of masking noise on a device.
   * @param device The device to stop the masking noise on.
   * @returns The device response for the request or undefined.
   */
  stopMaskingNoise?(device: IDevice): Promise<IDeviceResponse | undefined>;

  /**
   * Optional method to retrieve the application firmware that is available.
   * @returns The firmware asset provided by the application for the managed device type or undefined.
   */
  getApplicationFirmware?(): Promise<FirmwareAsset | undefined>;

  /**
   * Optional method to get available space on a device (DuoDose only?).
   * @returns The available space remaining on the device.
   */
  requestSdBytesFree?(device: IDevice): Promise<IDeviceResponse | undefined>;

  /**
   * Optional method to get directory long names (DuoDose only?).
   * @returns The directory long names on the device.
   */
  getDirectoryLongNames?(device: IDevice, baseDir: string): Promise<IDeviceResponse | undefined>;

  /**
   * Optional method to copy a file off a device onto the tablet (DuoDose only?).
   * @returns Success or error.
   */
  copyChaFileToLocalStorageAndReadFile?(device: IDevice, fileToRead: string): Promise<IDeviceResponse | undefined>;

  /**
   * Optional method to read file copied from a device (DuoDose only?).
   * @returns The text of the read file.
   */
  readCopiedChaFile?(device: IDevice, fileToRead: string): Promise<IDeviceResponse | undefined>;

  /**
   * Optional method to request setting (cha devices only).
   * @returns The requested setting.
   */
  requestSetting?(device: IDevice, setting: string): Promise<IDeviceResponse | undefined>;

  /**
   * Optional method to write setting (cha devices only).
   * @returns Success or error.
   */
  writeSetting?(device: IDevice, setting: string, value: number): Promise<IDeviceResponse | undefined>;

  /**
   * Optional method to transfer directory content to a device.
   * @param device The device to transfer directory content to.
   * @param localDirectory The directory to transfer from recursively.
   * @param remoteDirectory The directory to transfer to.
   * @returns The device response for the request or undefined.
   */
  transferDirectory?(device: IDevice, localDirectory: string, remoteDirectory: string): Promise<IDeviceResponse | undefined>;

  /**
   * Optional method to cancel any ongoing file operation.
   * @param device The device to cancel the file operation on.
   * @returns The device response for the request or undefined.
   */
  cancelFileOperation?(device: IDevice): Promise<IDeviceResponse | undefined>;

  /**
   * Optional method to start recording from a Svantek dosimeter.
   * @param device The Svantek device to start recording on.
   */
  startRecording?(device: IDevice): Promise<void>;

  /**
   * Optional method to stop recording from a Svantek dosimeter.
   * @param device The Svantek device to stop recording on.
   */
  stopRecording?(device: IDevice): Promise<void>;
}
