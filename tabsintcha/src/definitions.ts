import type { ListenerCallback, PermissionState, PluginListenerHandle } from '@capacitor/core';

export interface TabsintChaPlugin {
  /**
   * Add a listener for plugin events.
   * @param eventName The name of the event to listen for.
   * @param listenerFunc The listener function for the event.
   */
  addListener(eventName: string, listenerFunc: ListenerCallback): Promise<PluginListenerHandle>;

  /**
   * Remove all listeners for plugin events.
   * @returns A promise that resolves to void.
   */
  removeAllListeners(): Promise<void>;

  /**
   * Get the current status of permissions in the plugin.
   *
   * @param options Empty Object
   * @returns A promise that resolves to the current permission status.
   */
  checkPermissions(options: object): Promise<PermissionStatus>;

  /**
   * Prompts the end user for permission to use the platform APIs that the plugin requires.
   *
   * @param options Empty Object
   * @returns A promise that resolves to the new state of permissions after prompting.
   */
  requestPermissions(options: object): Promise<PermissionStatus>;

  /**
   * Get the device discovery event name needed for creating listeners for device searches.
   *
   * @param options Empty Object
   * @returns A promise that resolves to the device discovery event name.
   */
  getDeviceDiscoveryEventName(options: object): Promise<{ value: string }>;

  /**
   * Get the device response event name needed for creating listeners for device responses.
   *
   * @param options Empty Object
   * @returns A promise that resolves to the device response event name.
   */
  getDeviceResponseEventName(options: object): Promise<{ value: string }>;

  /**
   * Query state of the Bluetooth adapter.
   *
   * @param options Empty Object
   * @returns A promise that resolves to a string representation of the bluetooth adapter state ("Bluetooth On" or "Bluetooth Off").
   */
  getBluetoothAdapterState(options: object): Promise<{ value: string }>;

  /**
   * Enable/disable the Bluetooth adapter.
   *
   * @param options See SetBluetoothAdapterStateOptions
   * @returns A promise that resolves to a string representation of the bluetooth adapter state ("Bluetooth Enabled" or "Bluetooth Disabled").
   */
  setBluetoothAdapterState(options: SetBluetoothAdapterStateOptions): Promise<{ value: string }>;

  /**
   * Get the build version of the CHA device.
   *
   * @param options Empty Object
   * @returns A promise that resolves to a string representation of the build version.
   */
  getBuildVersion(options: object): Promise<{ value: string }>;

  /**
   * Begin discovery of available CHAs.  This will continue until cancelled.
   * The messages can be observed using PluginName.addListener('TabsintChaDiscovery', callback).
   * The discovery will first check if permissions are available before continuing with the search.
   *
   * @param options See StartChaSearchOptions
   * @returns A promise that resolves to a string status message.
   */
  startChaSearch(options: StartChaSearchOptions): Promise<{ value: string }>;

  /**
   * Abort discovery process.
   *
   * @param options Empty Object
   * @returns A promise that resolves to a string status message.
   */
  cancelChaSearch(options: object): Promise<{ value: string }>;

  /**
   * Connect to the specified CHA device.
   *
   * @param options See NameOptions
   * @returns A promise that resolves to a string status message.
   */
  connect(options: NameOptions): Promise<{ value: string }>;

  /**
   * Disconnect from the specified CHA device.
   *
   * @param options See NameOptions
   * @returns A promise that resolves to a string status message.
   */
  disconnect(options: NameOptions): Promise<{ value: string }>;

  /**
   * Request an A2DP interface to the CHA, that is associated with this CHA.
   *
   * @param options See NameOptions
   * @returns A promise that resolves to a string status message.
   */
  requestAssociatedA2DP(options: NameOptions): Promise<{ value: string }>;

  /**
   * Add a listener to receive notifications when events occur for the specified CHA device.
   * The messages can be observed using PluginName.addListener('TabsintChaDevice', callback)
   *
   * @param options See NameOptions
   * @returns A promise that resolves to the CHA device name.
   */
  startListener(options: NameOptions): Promise<{ value: string }>;

  /**
   * Remove the listener for the specified CHA device to stop receiving notifications for it.
   *
   * @param options See NameOptions
   * @returns A promise that resolves to the CHA device name.
   */
  stopListener(options: NameOptions): Promise<{ value: string }>;

  /**
   * Request the list of available calibrations from the specified CHA device.
   *
   * @param options See NameOptions
   * @returns A promise that resolves to a string status message.
   */
  requestCalibrationList(options: NameOptions): Promise<{ value: string }>;

  /**
   * Request the indexed section of the calibration entry from the specified CHA device.
   *
   * @param options See RequestCalibrationEntryOptions
   * @returns A promise that resolves to a string status message.
   */
  requestCalibrationEntry(options: RequestCalibrationEntryOptions): Promise<{ value: string }>;

  /**
   * Begin writing a calibration entry to a specified CHA device.
   *
   * @param options See StartCalibrationWriteOptions
   * @returns A promise that resolves to a string status message.
   */
  startCalibrationWrite(options: StartCalibrationWriteOptions): Promise<{ value: string }>;

  /**
   * Request the ID information of the specified CHA device.
   *
   * @param options See NameOptions
   * @returns A promise that resolves to a string status message.
   */
  requestId(options: NameOptions): Promise<{ value: string }>;

  /**
   * Request the ID information of the attached probe for the specified CHA device.
   *
   * @param options See NameOptions
   * @returns A promise that resolves to a string status message.
   */
  requestProbeId(options: NameOptions): Promise<{ value: string }>;

  /**
   * Request the status information of the specified CHA device.
   *
   * @param options See NameOptions
   * @returns A promise that resolves to a string status message.
   */
  requestStatus(options: NameOptions): Promise<{ value: string }>;

  /**
   * Add the exam object to a specified CHA device's queue.
   *
   * @param options See QueueExamOptions
   * @returns A promise that resolves to a string status message.
   */
  queueExam(options: QueueExamOptions): Promise<{ value: string }>;

  /**
   * Send user input for the current exam to a specified CHA device.
   *
   * @param options See ExamSubmissionOptions
   * @returns A promise that resolves to a string status message.
   */
  examSubmission(options: ExamSubmissionOptions): Promise<{ value: string }>;

  /**
   * Set the state of the software button for a specified CHA device.
   *
   * @param options See SetSoftwareButtonStateOptions
   * @returns A promise that resolves to a string status message.
   */
  setSoftwareButtonState(options: SetSoftwareButtonStateOptions): Promise<{ value: string }>;

  /**
   * Cancel all exams queued for the specified CHA device.
   *
   * @param options See NameOptions
   * @returns A promise that resolves to a string status message.
   */
  abortExams(options: NameOptions): Promise<{ value: string }>;

  /**
   * Request the results for an exam from the specified CHA device.
   *
   * @param options See NameOptions
   * @returns A promise that resolves to a string status message.
   */
  requestResults(options: NameOptions): Promise<{ value: string }>;

  /**
   * Request the available SD space in bytes from the specified CHA device.
   *
   * @param options See NameOptions
   * @returns A promise that resolves to a string status message.
   */
  requestSdBytesFree(options: NameOptions): Promise<{ value: string }>;

  /**
   * Request the specified CHA device to reprogram its firmware based on file 'CHA_PROG.DAT', which should already be on its media.
   * The CRC32 value will be checked against the CHA computed CRC32 and reject the reprogram if they do not match.
   *
   * @param options See ReprogramOptions
   * @returns A promise that resolves to a string status message.
   */
  reprogram(options: ReprogramOptions): Promise<{ value: string }>;

  /**
   * Reboot the specified CHA device.
   *
   * @param options See NameOptions
   * @returns A promise that resolves to a string status message.
   */
  reboot(options: NameOptions): Promise<{ value: string }>;

  /**
   * Shutdown the specified CHA device.
   * The command is ignored for USB connected devices.
   *
   * @param options See NameOptions
   * @returns A promise that resolves to a string status message.
   */
  shutdown(options: NameOptions): Promise<{ value: string }>;

  /**
   * Delete a file from a specified CHA device.
   * The directory is relative to the USER directory.
   *
   * @param options See DeleteFileOptions
   * @returns A promise that resolves to a string status message.
   */
  deleteFile(options: DeleteFileOptions): Promise<{ value: string }>;

  /**
   * Begin writing a file to the specified CHA device.
   *
   * @param options See StartFileWriteOptions
   * @returns A promise that resolves to a string status message.
   */
  startFileWrite(options: StartFileWriteOptions): Promise<{ value: string }>;

  /**
   * Begin reading a file from the specified CHA device.
   *
   * @param options See StartFileReadOptions
   * @returns A promise that resolves to a string status message.
   */
  startFileRead(options: StartFileReadOptions): Promise<{ value: string }>;

  /**
   * Request the specified CHA device transmits the contents of a directory.
   *
   * @param options See RequestDirectoryOptions
   * @returns A promise that resolves to a string status message.
   */
  requestDirectory(options: RequestDirectoryOptions): Promise<{ value: string }>;

  /**
   * Convert the short file name returned by the directory function into a long file name for the specified CHA device.
   *
   * @param options See GetLfnFromSfnOptions
   * @returns A promise that resolves to the long file name.
   */
  getLfnFromSfn(options: GetLfnFromSfnOptions): Promise<{ value: string }>;

  /**
   * Create a directory on the specified CHA device.
   *
   * @param options See MakeDirectoryOptions
   * @returns A promise that resolves to a string status message.
   */
  makeDirectory(options: MakeDirectoryOptions): Promise<{ value: string }>;

  /**
   * Cancel an ongoing streamable operations on the specified CHA device.
   *
   * @param options See NameOptions
   * @returns A promise that resolves to a string status message.
   */
  cancelFileOperation(options: NameOptions): Promise<{ value: string }>;

  /**
   * Command the specified CHA device to format its SD card.
   *
   * @param options See NameOptions
   * @returns A promise that resolves to a string status message.
   */
  format(options: NameOptions): Promise<{ value: string }>;

  /**
   * Whether the specified A2DP device is paired or not.
   *
   * @param options See NameOptions
   * @returns A promise that resolves to a string representation of the isPaired response.
   */
  a2dpIsPaired(options: NameOptions): Promise<{ value: string }>;

  /**
   * Whether the specified A2DP device is connected or not.
   *
   * @param options See NameOptions
   * @returns A promise that resolves to a string representation of the isConnected response.
   */
  a2dpIsConnected(options: NameOptions): Promise<{ value: string }>;

  /**
   * Begin pairing the specified A2DP device.
   *
   * @param options See NameOptions
   * @returns A promise that resolves to a string status message.
   */
  a2dpBeginPairing(options: NameOptions): Promise<{ value: string }>;

  /**
   * Unpair the specified A2DP device.
   *
   * @param options See NameOptions
   * @returns A promise that resolves to a string status message.
   */
  a2dpUnpair(options: NameOptions): Promise<{ value: string }>;

  /**
   * Begin connection to the specified A2DP device.
   *
   * @param options See NameOptions
   * @returns A promise that resolves to a string status message.
   */
  a2dpBeginConnection(options: NameOptions): Promise<{ value: string }>;

  /**
   * Disconnect to the specified A2DP device.
   *
   * @param options See NameOptions
   * @returns A promise that resolves to a string status message.
   */
  a2dpDisconnect(options: NameOptions): Promise<{ value: string }>;

  /**
   * Start playback of noise for the specified CHA device.
   *
   * @param options See NoiseFeatureStartOptions
   * @returns A promise that resolves to a string status message.
   */
  noiseFeatureStart(options: NoiseFeatureStartOptions): Promise<{ value: string }>;

  /**
   * Pause the playback of noise for the specified CHA device.
   *
   * @param options See NameOptions
   * @returns A promise that resolves to a string status message.
   */
  noiseFeaturePause(options: NameOptions): Promise<{ value: string }>;

  /**
   * Resume the playback of noise for the specified CHA device.
   *
   * @param options See NameOptions
   * @returns A promise that resolves to a string status message.
   */
  noiseFeatureResume(options: NameOptions): Promise<{ value: string }>;

  /**
   * Stop the playback of noise for the specified CHA device.
   *
   * @param options See NameOptions
   * @returns A promise that resolves to a string status message.
   */
  noiseFeatureStop(options: NameOptions): Promise<{ value: string }>;

  /**
   * Change the volume of the background noise without interrupting playback for the specified CHA device.
   *
   * @param options See NoiseFeatureChangeLevelOptions
   * @returns A promise that resolves to a string status message.
   */
  noiseFeatureChangeLevel(options: NoiseFeatureChangeLevelOptions): Promise<{ value: string }>;

  /**
   * Request a setting by its index in the setting table from the specified CHA device.
   *
   * @param options See RequestSettingOptions
   * @returns A promise that resolves to the setting name.
   */
  requestSetting(options: RequestSettingOptions): Promise<{ value: string }>;

  /**
   * Write a setting by its index in the setting table to the specified CHA device.
   *
   * @param options See WriteSettingOptions
   * @returns A promise that resolves to a string status message.
   */
  writeSetting(options: WriteSettingOptions): Promise<{ value: string }>;

  /**
   * Request the current exam id from the specified CHA device.
   *
   * @param options See NameOptions
   * @returns A promise that resolves to a string status message.
   */
  requestExamId(options: NameOptions): Promise<{ value: string }>;
}

export interface PermissionStatus {
  /**
   * Bluetooth permission status.
   */
  bluetooth: PermissionState;
}

export interface NameOptions {
  /**
   * The CHA device name.
   */
  name: string;
}

export interface SetBluetoothAdapterStateOptions {
  /**
   * The new state for the bluetooth adapter ("on" or "off").
   */
  newState: string;
}

export interface StartChaSearchOptions {
  /**
   * The CHA interface argument for the search.
   * This indicates the type of connection to search for devices.
   */
  infStr: string;
}

export interface RequestCalibrationEntryOptions extends NameOptions {
  /**
   * The index for the calibration entry to stream.
   */
  index: number;
}

export interface StartCalibrationWriteOptions extends NameOptions {
  /**
   * The index of the calibration to write to.
   */
  index: number;

  /**
   * The description used the calibration list.
   */
  entry: object;

  /**
   * The calibration data arguments.
   */
  dataArgs: object;

  /**
   * Speaker data arguments to be added to the calibration data.
   */
  speakerArgs: object | undefined;
}

export interface QueueExamOptions extends NameOptions {
  /**
   * The name of the exam to queue.
   */
  examName: string;

  /**
   * The parameters for the exam.
   */
  params: object | undefined;
}

export interface ExamSubmissionOptions extends NameOptions {
  /**
   * The name of the exam submission.
   */
  submissionName: string;

  /**
   * The parameters for the exam submission.
   */
  params: object | undefined;
}

export interface SetSoftwareButtonStateOptions extends NameOptions {
  /**
   * The new state of the software button to be set (0 or 1).
   */
  state: number;
}

export interface ReprogramOptions extends NameOptions {
  /**
   * The CRC32 checksum value to be used for validation in a reprogram request.
   */
  crc32: number;
}

export interface DeleteFileOptions extends NameOptions {
  /**
   * The remote file on the device to be deleted.
   */
  remoteFile: string;

  /**
   * Modification flags for request.
   */
  flags: number | undefined;
}

export interface StartFileWriteOptions extends NameOptions {
  /**
   * The path to the file on the device to create.
   */
  localFile: string;

  /**
   * The path on the CHA to read.
   */
  remoteFile: string;

  /**
   * Modification flags for request.
   */
  flags: number | undefined;
}

export interface StartFileReadOptions extends NameOptions {
  /**
   * The path to the file on the device to create.
   */
  localFile: string;

  /**
   * The path on the CHA to read.
   */
  remoteFile: string;
}

export interface RequestDirectoryOptions extends NameOptions {
  /**
   * The directory on the CHA to read.
   */
  remotePath: string;

  /**
   * Modification flags for request.
   */
  flags: number | undefined;
}

export interface GetLfnFromSfnOptions extends NameOptions {
  /**
   *  The full path to the short file.
   */
  fullPath: string;
}

export interface MakeDirectoryOptions extends NameOptions {
  /**
   * The directory on the CHA to create.
   */
  remotePath: string;

  /**
   * Modification flags for request.
   */
  flags: number;
}

export interface NoiseFeatureStartOptions extends NameOptions {
  /**
   * The configuration parameters for the noise.
   */
  params: object | undefined;
}

export interface NoiseFeatureChangeLevelOptions extends NameOptions {
  /**
   * An array of length two of levels for left/right.
   */
  levels: number[];
}

export interface RequestSettingOptions extends NameOptions {
  /**
   *  The name of the setting to read.
   */
  settingName: string;
}

export interface WriteSettingOptions extends NameOptions {
  /**
   * The name of the setting to modify.
   */
  settingName: string;

  /**
   * The new value for the setting.
   */
  value: number;
}

export interface DiscoveryResponse extends NameOptions {
  /**
   * The status of the discovery ('searching' or 'done').
   */
  status: string;
}

export interface DeviceResponse extends NameOptions {
  /**
   * The response from the device.
   * If the response is valid it should follow the format of [identifier, responseObject].
   * If there is an error, a string is returned.
   */
  res: [string, Record<string, any>] | string;
}
