import { BluetoothType } from '../../utilities/constants';
import { IDevice } from './device.interface';

/**
 * The interface for CHA devices.
 */
export interface IChaDevice extends IDevice {
  /**
   * The message identifier for a message sent to the device.
   * Used to track outbound messages and the respective responses which are returned.
   *
   */
  msgId: number;

  /**
   * The connection type which was used to setup the device.
   */
  connectionType: BluetoothType;
}
