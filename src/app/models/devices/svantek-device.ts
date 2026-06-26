import { DeviceState, DeviceStatus, DeviceType } from '../../utilities/constants';
import { ISvantekDevice } from '../../interfaces/devices/svantek-device.interface';
import { IDeviceMetadata } from '../../interfaces/devices/device-metadata.interface';

/**
 * Svantek dosimeter implementation of the device interface.
 */
export class SvantekDevice implements ISvantekDevice {
  deviceId: string;
  name: string;
  state: DeviceState;
  status: DeviceStatus;
  type: DeviceType;
  tabsintId: string;
  metadata: IDeviceMetadata;

  constructor(deviceId: string, name: string, tabsintId?: string) {
    this.deviceId = deviceId;
    this.name = name;
    this.type = DeviceType.Svantek;
    this.state = DeviceState.Disconnected;
    this.status = DeviceStatus.Ready;
    this.tabsintId = tabsintId ?? deviceId;
    this.metadata = {};
  }
}
