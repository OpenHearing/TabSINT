import { IDeviceResponse } from './device-response.interface';

/**
 * Generic request ID response for devices.
 */
export interface RequestIdResponse extends IDeviceResponse {
  msg: [unknown, RequestIdObject];
}

export interface RequestSettingResponse extends IDeviceResponse {
  msg: [unknown, RequestSettingObject];
}

/**
 * Generic status response for devices.
 */
export interface StatusResponse extends IDeviceResponse {
  msg: [unknown, StatusObject];
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

/**
 * Object held in a request setting response.
 */
export interface RequestSettingObject {
  /**
   * Index.
   */
  Index: number;

  /**
   * The build datetime for the device firmware.
   */
  Value: number;
}

/**
 * Object held in a status response.
 */
export interface StatusObject {
  /**
   * State of the device
   */
  flags: number;
  iCharge: number;
  lastCtrlError: number;
  soc_pct: number;
  state: number;
  vBattery: number;
  vUsb: number;
}
