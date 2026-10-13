import { IDeviceMetadata } from '../../interfaces/devices/device-metadata.interface';
import { DeviceType, DeviceState, DeviceStatus } from '../../utilities/constants';
import { ITympanDevice } from '../../interfaces/devices/tympan-device.interface';

/**
 * Tympan implementation of the device interface.
 */
export class TympanDevice implements ITympanDevice {
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
   */
  msgId: number;

  /**
   * The maximum chunk size for device writing.
   */
  maxByteLength: number;

  /**
   * Initialize the device with the needed properties.
   * @param deviceId The identifier for the device.
   * @param name The friendly name for the device.
   * @param tabsintId The TabSINT identifier for the device. If not provided, should match the device identifier.
   */
  constructor(deviceId: string, name: string, tabsintId?: string) {
    this.deviceId = deviceId;
    this.name = name;
    this.state = DeviceState.Disconnected;
    this.status = DeviceStatus.Ready;
    this.type = DeviceType.Tympan;
    this.tabsintId = tabsintId ?? deviceId;
    this.msgId = -1;
    this.maxByteLength = 244;
    this.metadata = {};
  }
}
