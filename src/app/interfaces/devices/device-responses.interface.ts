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
 * Generic file progress response for devices.
 */
export interface FileProgressResponse extends IDeviceResponse {
  msg: [unknown, FileProgressObject];
}

/**
 * Generic file operation complete response for devices.
 */
export interface FileOperationCompleteResponse extends IDeviceResponse {
  msg: [unknown, FileOperationCompleteObject];
}

/**
 * Generic directory entry response for devices.
 */
export interface DirectoryEntryResponse extends IDeviceResponse {
  msg: [unknown, DirectoryEntryObject];
}

/**
 * Generic get directory response for devices.
 */
export interface GetDirectoryResponse extends IDeviceResponse {
  msg: [unknown, DirectoryEntryObject[]];
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

/**
 * Object held in a file progress response.
 */
export interface FileProgressObject {
  /**
   * The bytes that have been transferred.
   */
  BytesTransferred: number;

  /**
   * The total bytes to transfer.
   */
  TotalBytes: number;
}

/**
 * Object held in a file operation complete response.
 */
export interface FileOperationCompleteObject {
  /**
   * The outcome of the operation.
   */
  Outcome: string;
}

/**
 * Object held in a directory entry operation response.
 */
export interface DirectoryEntryObject {
  /**
   * The path for the entry.
   */
  Path: string;

  /**
   * The entry size in bytes.
   */
  SizeBytes: number;

  /**
   * The entry attributes.
   */
  Attributes: number;
}
