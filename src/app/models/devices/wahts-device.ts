import { DeviceType } from '../../utilities/constants';
import { IWahtsDeviceMetadata } from '../../interfaces/devices/wahts-device-metadata.interface';
import { IWahtsDevice } from '../../interfaces/devices/wahts-device.interface';
import { ChaDevice } from './cha-device';

/**
 * WAHTS implementation of the device interface.
 */
export class WahtsDevice extends ChaDevice implements IWahtsDevice {
  declare metadata: IWahtsDeviceMetadata;

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
