import { FirmwareAsset } from '../firmware-asset.interface';
import { IDeviceResponse } from './device-response.interface';
import { IDevice } from './device.interface';

/**
 * Device Adapter Interface.
 * Used for interactions with a singular device.
 */
export interface IDeviceAdapter {
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
   * Optional method to request a device identifier.
   * @param device The device to request the identifier from.
   */
  requestId?(device: IDevice): Promise<IDeviceResponse>;

  /**
   * Optional method to request the status of a device.
   * @param device The device to request status from.
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
   * @param examId The identifier of the exam to request results for.
   */
  requestResults?(device: IDevice): Promise<IDeviceResponse>;

  /**
   * Optional method to reprogram a device.
   * @param device The device to reprogram.
   * @param firmwareAsset The metadata related to the firmware to reprogram.
   * @param progressCallback A callback which takes IDeviceResponse values for progress response updates.
   * @returns The device response for the reprogram request or undefined.
   */
  reprogram?(
    device: IDevice,
    firmwareAsset: FirmwareAsset,
    progressCallback: (progress: IDeviceResponse) => void
  ): Promise<IDeviceResponse | undefined>;

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
}
