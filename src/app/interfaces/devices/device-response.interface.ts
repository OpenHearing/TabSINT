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
   */
  msg: unknown[];
}
