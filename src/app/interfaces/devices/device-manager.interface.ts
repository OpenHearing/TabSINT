import { Observable } from 'rxjs';
import { IDevice } from './device.interface';
import { IDeviceResponse } from './device-response.interface';
import { SavedDevice } from '../../models/disk/disk.interface';
import { FirmwareAsset } from '../firmware-asset.interface';

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
   * @param examId The identifier of the exam to request results for.
   */
  requestResults?(device: IDevice): Promise<IDeviceResponse>;

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
}
