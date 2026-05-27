/**
 * Interface used for device responses.
 */
export interface IDeviceResponse {
  /**
   * Device identifier associated with the response.
   */
  deviceId: string;

  /**
   * The response message as an array of unknown values.
   * For Tympan Devices, the typical message array should look like the following: [MsgId, Message...]
   * For CHA Devices, the typical message array should look like the following: [MsgType, Message...]
   * Errors need to be reported as: [MsgId or MsgType, ERROR, Message]  (may require conversion)
   */
  msg: unknown[];
}
