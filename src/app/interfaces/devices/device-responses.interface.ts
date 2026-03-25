/**
 * Object held in a request ID response.
 */
export interface RequestIdResponse {
  /**
   * Serial number for the device.
   */
  serialNumber?: number;

  /**
   * Description of the device.
   */
  description?: string;

  /**
   * The build datetime for the device firmware.
   */
  buildDateTime?: string;
}
