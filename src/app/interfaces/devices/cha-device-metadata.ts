import { IDeviceMetadata } from './device-metadata.interface';

/**
 * Additional metadata specific to WAHTS devices, populated on device connect.
 */
export interface IChaDeviceMetadata extends IDeviceMetadata {
  /**
   * The date the device was last calibrated.
   */
  calibrationDate?: string;

  /**
   * The battery level of the device as a percentage (0–100).
   */
  batteryLevel?: number;

  /**
   * The auto shutdown time in minutes.
   */
  autoShutdownTime?: number;
}
