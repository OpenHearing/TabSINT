import { IChaDeviceMetadata } from './cha-device-metadata';
import { IChaDevice } from './cha-device.interface';

/**
 * The interface for Duodose devices.
 */
export interface IDuodoseDevice extends IChaDevice {
  metadata: IChaDeviceMetadata;
}
