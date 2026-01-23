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
}
