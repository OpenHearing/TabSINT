import { IDevice } from './device.interface';

/**
 * The interface for Tympan devices.
 */
export interface ITympanDevice extends IDevice {
  /**
   * The message identifier for a message sent to the device.
   * Used to track outbound messages and the respective responses which are returned.
   *
   */
  msgId: number;

  /**
   * The maximum chunk size for device writing.
   */
  maxByteLength: number;
}
