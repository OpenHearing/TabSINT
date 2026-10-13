import { IChaDeviceMetadata } from './cha-device-metadata';
import { IChaDevice } from './cha-device.interface';

/**
 * The interface for WAHTS devices.
 */
export interface IWahtsDevice extends IChaDevice {
  metadata: IChaDeviceMetadata;
}
