import { IDeviceResponse } from './device-response.interface';

/**
 * Generic request ID response for devices.
 */
export interface RequestIdResponse extends IDeviceResponse {
  msg: [unknown, RequestIdObject];
}

/**
 * Object held in a request ID response.
 */
export interface RequestIdObject {
  /**
   * Serial number for the device.
   */
  serialNumber: number;

  /**
   * The build datetime for the device firmware.
   */
  buildDateTime: string;

  /**
   * Description of the device.
   */
  description?: string;
}
