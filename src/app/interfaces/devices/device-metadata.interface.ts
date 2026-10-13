/**
 * Additional metadata for a device.
 * All information should be optional and not necessary for connection or device management.
 */
export interface IDeviceMetadata {
  /**
   * A description of the device.
   */
  description?: string;

  /**
   * A UUID associated with the device.
   * This is separate from the device identifier used by the application.
   */
  uuid?: string;

  /**
   * The build time of the device.
   */
  buildDateTime?: string;

  /**
   * The devices serial number.
   */
  serialNumber?: string;

  /**
   * The manufacturer of the device.
   */
  build?: string;

  /**
   * The version of the device.
   */
  version?: string;

  /**
   * The platform of the device.
   */
  platform?: string;

  /**
   * The model of the device.
   */
  model?: string;

  /**
   * The operating system of the device.
   */
  os?: string;

  /**
   * The remaining disk space on the device.
   */
  diskSpace?: string;

  /**
   * Additional information unique to specific devices held as a string.
   */
  other?: string;
}
