import { DeviceType } from '../../utilities/constants';
import { ChaDevice } from './cha-device';

/**
 * WAHTS implementation of the device interface.
 */
export class WahtsDevice extends ChaDevice {
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
