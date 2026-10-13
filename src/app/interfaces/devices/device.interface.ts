import { IDeviceMetadata } from './device-metadata.interface';
import { DeviceState, DeviceStatus, DeviceType } from '../../utilities/constants';

/**
 * The base interface for all devices.
 */
export interface IDevice {
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
}
