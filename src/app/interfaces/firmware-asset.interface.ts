/**
 * Information related to a firmware file provided by the application.
 */
export interface FirmwareAsset {
  /**
   * The name of the firmware file.
   */
  fileName: string;

  /**
   * The path to the firmware file which is accessible by a device manager.
   * This path could be a standard filesystem location, asset path, etc. depending on the device.
   */
  filePath: string;

  /**
   * The firmware version/tag.
   */
  version: string;

  /**
   * Build date and time of the firmware.
   */
  buildDatetime: string;

  /**
   * Checksum to verify firmware file integrity (typically CRC32).
   */
  checksum: number;
}
