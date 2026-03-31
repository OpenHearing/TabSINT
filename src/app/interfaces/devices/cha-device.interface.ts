import { BluetoothType, DeviceState, DeviceStatus, DeviceType } from '../../utilities/constants';
import { IDeviceMetadata } from './device-metadata.interface';
import { IDevice } from './device.interface';

/**
 * The interface for CHA devices.
 */
export interface IChaDevice extends IDevice {
  /**
   * The identifier for the device.
   */
  deviceId: string;

  /**
   * The friendly name for the device.
   */
  name: string;

  /**
   * The current device connection state.
   */
  state: DeviceState;

  /**
   * The current device status.
   */
  status: DeviceStatus;

  /**
   * The device type.
   */
  type: DeviceType;

  /**
   * The TabSINT identifier for the device, if not provided should match the device identifier.
   * This is a user configurable identifier within the application used in exams.
   */
  tabsintId: string;

  /**
   * Additional metadata associated with the device.
   */
  metadata: IDeviceMetadata;

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
