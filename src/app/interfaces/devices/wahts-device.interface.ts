import { IChaDevice } from './cha-device.interface';
import { IWahtsDeviceMetadata } from './wahts-device-metadata.interface';

/**
 * The interface for WAHTS devices.
 */
export interface IWahtsDevice extends IChaDevice {
  metadata: IWahtsDeviceMetadata;
}
