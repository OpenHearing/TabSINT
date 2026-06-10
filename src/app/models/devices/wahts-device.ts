import { DeviceType } from '../../utilities/constants';
import { IWahtsDevice } from '../../interfaces/devices/wahts-device.interface';
import { ChaDevice } from './cha-device';
import { IChaDeviceMetadata } from '../../interfaces/devices/cha-device-metadata';

/**
 * WAHTS implementation of the device interface.
 */
export class WahtsDevice extends ChaDevice implements IWahtsDevice {
  declare metadata: IChaDeviceMetadata;

  /**
   * Initialize the device with the needed properties.
   * @param deviceId The identifier for the device.
   * @param name The friendly name for the device.
   * @param tabsintId The TabSINT identifier for the device. If not provided, should match the device identifier.
   */
  constructor(deviceId: string, name: string, tabsintId?: string) {
    super(DeviceType.Wahts, deviceId, name, tabsintId);
  }
}
