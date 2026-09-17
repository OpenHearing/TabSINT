import { ChaDeviceType, DeviceStatus } from '../../utilities/constants';
import { IDeviceAdapter } from '../../interfaces/devices/device-adapter.interface';
import { Logger } from '../logger.service';
import { IDeviceResponse } from '../../interfaces/devices/device-response.interface';
import { DeviceResponse, DiscoveryResponse, TabsintCha } from 'tabsintcha';
import { PluginListenerHandle } from '@capacitor/core';
import { BehaviorSubject, catchError, filter, firstValueFrom, of, skip, Subject, timeout } from 'rxjs';
import { FirmwareAsset } from '../../interfaces/firmware-asset.interface';
import { isDirectoryEntryResponse, isStatusResponse, isSuccessfulFileOperation } from '../../guards/type.guard';
import { inject } from '@angular/core';
import { Directory, Filesystem, Encoding } from '@capacitor/filesystem';
import { DirectoryEntryObject } from '../../interfaces/devices/device-responses.interface';
import { MaskingNoise } from '../../views/response-area/response-areas/shared/audiometry/audiometry.interface';

/**
 * CHA base device adapter.
 */
export class ChaAdapter implements IDeviceAdapter {
  private readonly logger = inject(Logger);

  /**
   * Behavioral subject which emits message responses for all devices.
   */
  private static readonly responseSubject = new BehaviorSubject<IDeviceResponse | undefined>(undefined);

  /**
   * The default timeout for responses (milliseconds).
   */
  private readonly defaultTimeoutTimeMs = 3000;

  /**
   * Whether a device listener has been set for the CHA plugin.
   */
  private static isDeviceListenerSet = false;

  /**
   * Callbacks invoked when a disconnection event occurs for the given device identifier.
   */
  private static readonly disconnectCallbacks: ((id: string) => void)[] = [];

  /**
   * Callbacks invoked when a device property needs to be updated for the given device.
   */
  private static readonly deviceUpdateCallbacks: ((device: ChaDeviceType) => void)[] = [];

  /**
   * Register a callback for disconnection events.
   * @param disconnectCallback The callback for disconnect events.
   */
  registerDisconnectCallback(disconnectCallback: (id: string) => void) {
    ChaAdapter.disconnectCallbacks.push(disconnectCallback);
  }

  /**
   * Register a callback for device update events.
   * @param onDeviceUpdate The callback for device state change events.
   */
  registerDeviceUpdateCallback(onDeviceUpdate: (device: ChaDeviceType) => void) {
    ChaAdapter.deviceUpdateCallbacks.push(onDeviceUpdate);
  }

  /**
   * Connect to the device.
   * @param device The device to be connected to.
   */
  async connect(device: ChaDeviceType): Promise<void> {
    if (!ChaAdapter.isDeviceListenerSet) {
      const logger = this.logger;
      await TabsintCha.addListener('TabsintChaDevice', response => ChaAdapter.deviceEventListener(response, logger));
      ChaAdapter.isDeviceListenerSet = true;
    }
    const nameOptions = { name: device.deviceId };
    await TabsintCha.connect(nameOptions);
    await TabsintCha.startListener(nameOptions);
  }

  /**
   * Disconnect from the device.
   * @param device The device to be disconnected from.
   */
  async disconnect(device: ChaDeviceType) {
    const nameOptions = { name: device.deviceId };
    await TabsintCha.disconnect(nameOptions);
    await TabsintCha.stopListener(nameOptions);
  }

  /**
   * Request a device identifier.
   * @param device The device to request the identifier from.
   */
  async requestId(device: ChaDeviceType): Promise<IDeviceResponse> {
    const response = await this.runWithStateChanges<IDeviceResponse>(device, async () => {
      const nameOptions = { name: device.deviceId };
      let deviceResponse = this.defaultInvalidResponse(device);
      try {
        const waitForResponse = this.waitForResponse(device, 'Id');
        await TabsintCha.requestId(nameOptions);
        deviceResponse = (await waitForResponse) ?? deviceResponse;
      } catch (err) {
        this.logger.error('Failed to write to CHA', err);
      }
      return deviceResponse;
    });
    return response;
  }

  /**
   * Request the status of a device.
   * @param device The device to request status from.
   */
  async requestStatus(device: ChaDeviceType): Promise<IDeviceResponse> {
    const response = await this.runWithStateChanges<IDeviceResponse>(device, async () => {
      const nameOptions = { name: device.deviceId };
      let deviceResponse = this.defaultInvalidResponse(device);
      try {
        const waitForResponse = this.waitForResponse(device, 'Status');
        await TabsintCha.requestStatus(nameOptions);
        deviceResponse = (await waitForResponse) ?? deviceResponse;
      } catch (err) {
        this.logger.error('Failed to write to CHA', err);
      }
      return deviceResponse;
    });
    return response;
  }

  /**
   * Queue an exam for a device.
   * @param device The device to queue the exam for.
   * @param examId The identifier of the exam to be queued.
   * @param examProperties Object holding properties related to the exam.
   */
  async queueExam(device: ChaDeviceType, examType: string, examProperties: object): Promise<IDeviceResponse> {
    const response = await this.runWithStateChanges<IDeviceResponse>(device, async () => {
      const queueExamOptions = { name: device.deviceId, examName: examType, params: examProperties };
      let deviceResponse = this.defaultInvalidResponse(device);
      try {
        const msg = await TabsintCha.queueExam(queueExamOptions);
        deviceResponse = { deviceId: device.deviceId, msg: ['QueueExam', msg] };
      } catch (err) {
        this.logger.error('Failed to write to CHA', err);
      }
      return deviceResponse;
    });
    return response;
  }

  /**
   * Submit an exam submission for a device.
   * @param device The device which the submission will be sent to.
   * @param examProperties Object holding properties related to the exam.
   * @param ignoreErrors A list of keywords for which matching errors will be ignored.
   */
  async examSubmission(device: ChaDeviceType, examProperties: object, ignoreErrors: string[]): Promise<IDeviceResponse> {
    const response = await this.runWithStateChanges<IDeviceResponse>(device, async () => {
      // `name` selects the submission class; it must not be forwarded as a device parameter,
      // otherwise the native introspection rejects it as an unknown field on the class.
      const { name, ...params } = examProperties as { name?: string } & Record<string, unknown>;
      const examSubmissionOptions = { name: device.deviceId, submissionName: name as string, params };
      let deviceResponse = this.defaultInvalidResponse(device);
      try {
        const msg = await TabsintCha.examSubmission(examSubmissionOptions);
        deviceResponse = { deviceId: device.deviceId, msg: ['ExamSubmission', msg] };
      } catch (err) {
        this.logger.error('Failed to write to CHA', err);
      }
      return deviceResponse;
    });
    return response;
  }

  /**
   * Start playback of masking noise on a device.
   * @param device The device to start the masking noise on.
   * @param maskingNoise The masking noise configuration.
   */
  async startMaskingNoise(device: ChaDeviceType, maskingNoise: MaskingNoise): Promise<IDeviceResponse> {
    const response = await this.runWithStateChanges<IDeviceResponse>(device, async () => {
      const noiseFeatureStartOptions = { name: device.deviceId, params: maskingNoise };
      let deviceResponse = this.defaultInvalidResponse(device);
      try {
        const msg = await TabsintCha.noiseFeatureStart(noiseFeatureStartOptions);
        deviceResponse = { deviceId: device.deviceId, msg: ['StartMaskingNoise', msg] };
      } catch (err) {
        this.logger.error('Failed to write to CHA', err);
      }
      return deviceResponse;
    });
    return response;
  }

  /**
   * Stop playback of masking noise on a device.
   * @param device The device to stop the masking noise on.
   */
  async stopMaskingNoise(device: ChaDeviceType): Promise<IDeviceResponse> {
    const response = await this.runWithStateChanges<IDeviceResponse>(device, async () => {
      const nameOptions = { name: device.deviceId };
      let deviceResponse = this.defaultInvalidResponse(device);
      try {
        const msg = await TabsintCha.noiseFeatureStop(nameOptions);
        deviceResponse = { deviceId: device.deviceId, msg: ['StopMaskingNoise', msg] };
      } catch (err) {
        this.logger.error('Failed to write to CHA', err);
      }
      return deviceResponse;
    });
    return response;
  }

  /**
   * Abort an exam for a device.
   * @param device The device to abort the exam for.
   */
  async abortExams(device: ChaDeviceType): Promise<IDeviceResponse> {
    const response = await this.runWithStateChanges<IDeviceResponse>(device, async () => {
      const nameOptions = { name: device.deviceId };
      let deviceResponse = this.defaultInvalidResponse(device);
      try {
        const msg = await TabsintCha.abortExams(nameOptions);
        deviceResponse = { deviceId: device.deviceId, msg: ['AbortExams', msg] };
      } catch (err) {
        this.logger.error('Failed to write to CHA', err);
      }
      return deviceResponse;
    });
    return response;
  }

  /**
   * Request results from an exam for a device.
   * @param device The device to request exam results from.
   * @param timeoutTimeMs How long to wait for the results response before giving up.
   */
  async requestResults(device: ChaDeviceType, timeoutTimeMs: number = this.defaultTimeoutTimeMs): Promise<IDeviceResponse> {
    const response = await this.runWithStateChanges<IDeviceResponse>(device, async () => {
      const nameOptions = { name: device.deviceId };
      let deviceResponse = this.defaultInvalidResponse(device);
      try {
        const waitForResponse = this.waitForResponse(device, 'Result', timeoutTimeMs);
        await TabsintCha.requestResults(nameOptions);
        deviceResponse = (await waitForResponse) ?? deviceResponse;
      } catch (err) {
        this.logger.error('Failed to write to CHA', err);
      }
      return deviceResponse;
    });
    return response;
  }

  /**
   * Reprogram firmware for a device.
   * @param device The device to reprogram.
   * @param firmwareAsset The metadata related to the firmware to reprogram.
   * @param progressCallback A callback which takes IDeviceResponse values for FileProgress response updates.
   * @returns The device response for the reprogram operation.
   */
  async reprogramFirmware(
    device: ChaDeviceType,
    firmwareAsset: FirmwareAsset,
    progressCallback?: (progress: IDeviceResponse) => void
  ): Promise<IDeviceResponse> {
    const response = await this.runWithStateChanges<IDeviceResponse>(device, async () => {
      const startFirmwareWriteOptions = { name: device.deviceId, localFile: firmwareAsset.filePath, remoteFile: 'CHA_PROG.dat', flags: 0 };
      let deviceResponse = this.defaultInvalidResponse(device);
      try {
        const writeResponsePromise = this.waitForResponseWithStatusUpdates(device, 'FileOperationComplete', 'FileProgress', progressCallback, 10000);
        await TabsintCha.startFileWrite(startFirmwareWriteOptions);
        const writeResponse = await writeResponsePromise;

        let reprogramResponse: IDeviceResponse | undefined = undefined;
        if (isSuccessfulFileOperation(writeResponse)) {
          const reprogramOptions = { name: device.deviceId, crc32: firmwareAsset.checksum };
          const msg = await TabsintCha.reprogram(reprogramOptions);
          reprogramResponse = { deviceId: device.deviceId, msg: ['Reprogram', msg] };
        }
        deviceResponse = reprogramResponse ?? deviceResponse;
      } catch (err) {
        this.logger.error('Failed to write to CHA', err);
      }
      return deviceResponse;
    });
    return response;
  }

  /**
   * Reboot a device.
   * @param device The device to reboot.
   * @returns The device response for the reboot operation.
   */
  async reboot(device: ChaDeviceType): Promise<IDeviceResponse> {
    const response = await this.runWithStateChanges<IDeviceResponse>(device, async () => {
      const rebootOptions = { name: device.deviceId };
      let deviceResponse = this.defaultInvalidResponse(device);
      try {
        const msg = await TabsintCha.reboot(rebootOptions);
        deviceResponse = { deviceId: device.deviceId, msg: ['Reboot', msg] };
      } catch (err) {
        this.logger.error('Failed to write to CHA', err);
      }
      return deviceResponse;
    });
    return response;
  }

  /**
   * Set the state of the software response button for a device.
   * @param device The device to set the software button state for.
   * @param state The new state of the software button (0 or 1).
   * @returns The device response for the request.
   */
  async setSoftwareButtonState(device: ChaDeviceType, state: number): Promise<IDeviceResponse> {
    const response = await this.runWithStateChanges<IDeviceResponse>(device, async () => {
      const setSoftwareButtonStateOptions = { name: device.deviceId, state: state };
      let deviceResponse = this.defaultInvalidResponse(device);
      try {
        const msg = await TabsintCha.setSoftwareButtonState(setSoftwareButtonStateOptions);
        deviceResponse = { deviceId: device.deviceId, msg: ['SetSoftwareButtonState', msg] };
      } catch (err) {
        this.logger.error('Failed to write to CHA', err);
      }
      return deviceResponse;
    });
    return response;
  }

  /**
   * Cancel any ongoing file operation.
   * @param device The device to cancel the file operation on.
   * @returns The device response for the request.
   */
  async cancelFileOperation(device: ChaDeviceType): Promise<IDeviceResponse> {
    const response = await this.runWithStateChanges<IDeviceResponse>(device, async () => {
      const nameOptions = { name: device.deviceId };
      let deviceResponse = this.defaultInvalidResponse(device);
      try {
        const msg = await TabsintCha.cancelFileOperation(nameOptions);
        deviceResponse = { deviceId: device.deviceId, msg: ['CancelFileOperation', msg] };
      } catch (err) {
        this.logger.error('Failed to write to CHA', err);
      }
      return deviceResponse;
    });
    return response;
  }

  /**
   * Write file to the device.
   * @param device The device to write the file to.
   * @param localFile The local file to write.
   * @param remoteFile The remote file to write to.
   * @param flags Optional flags to pass to the write request.
   * @param progressCallback A callback which takes IDeviceResponse values for FileProgress response updates.
   * @returns The device response for the request.
   */
  async fileWrite(
    device: ChaDeviceType,
    localFile: string,
    remoteFile: string,
    flags: number | undefined = undefined,
    progressCallback?: (progress: IDeviceResponse) => void
  ): Promise<IDeviceResponse> {
    const response = await this.runWithStateChanges<IDeviceResponse>(device, async () => {
      const startFileWriteOptions = { name: device.deviceId, localFile: localFile, remoteFile: remoteFile, flags: flags };
      let deviceResponse = this.defaultInvalidResponse(device);
      try {
        const writeResponsePromise = this.waitForResponseWithStatusUpdates(device, 'FileOperationComplete', 'FileProgress', progressCallback, 10000);
        await TabsintCha.startFileWrite(startFileWriteOptions);
        const writeResponse = await writeResponsePromise;
        if (isSuccessfulFileOperation(writeResponse)) {
          deviceResponse = writeResponse;
        }
      } catch (err) {
        this.logger.error('Failed to write to CHA', err);
      }
      return deviceResponse;
    });
    return response;
  }

  /**
   * Delete a file from the device.
   * @param device The device to delete the file from.
   * @param fileName The file to delete.
   * @param flags Optional flags to pass to the delete request.
   * @returns The device response for the request.
   */
  async deleteFile(device: ChaDeviceType, fileName: string, flags: number | undefined = undefined): Promise<IDeviceResponse> {
    const response = await this.runWithStateChanges<IDeviceResponse>(device, async () => {
      const nameOptions = { name: device.deviceId };
      const deleteFileOptions = {
        name: device.deviceId,
        remoteFile: fileName,
        flags: flags,
      };
      let deviceResponse = this.defaultInvalidResponse(device);
      try {
        await TabsintCha.deleteFile(deleteFileOptions);

        // Check status which determines success or failure
        const waitForResponse = this.waitForResponse(device, 'Status');
        await TabsintCha.requestStatus(nameOptions);
        const statusResponse = (await waitForResponse) ?? deviceResponse;
        if (isStatusResponse(statusResponse)) {
          // 0 lastCtrlError signals the deletion request went through properly so return that as the device response
          if (statusResponse.msg[1].lastCtrlError === 0) {
            deviceResponse = { deviceId: device.deviceId, msg: ['Success', fileName] };
          }
        }
      } catch (err) {
        this.logger.error('Failed to write to CHA', err);
      }
      return deviceResponse;
    });
    return response;
  }

  /**
   * Make a directory on the device.
   * @param device The device to make a directory on.
   * @param remotePath The remote directory path on the device to be created.
   * @param flags Optional flags to pass to the directory request.
   */
  async makeDirectory(device: ChaDeviceType, remotePath: string, flags: number = 0): Promise<IDeviceResponse> {
    const response = await this.runWithStateChanges<IDeviceResponse>(device, async () => {
      const nameOptions = { name: device.deviceId };
      const makeDirectoryOptions = { name: device.deviceId, remotePath: remotePath, flags: flags };
      let deviceResponse = this.defaultInvalidResponse(device);
      try {
        await TabsintCha.makeDirectory(makeDirectoryOptions);

        // Check status which determines success or failure
        const waitForResponse = this.waitForResponse(device, 'Status');
        await TabsintCha.requestStatus(nameOptions);
        const statusResponse = (await waitForResponse) ?? deviceResponse;
        if (isStatusResponse(statusResponse)) {
          // 0 lastCtrlError signals the directory request went through properly so return that as the device response
          if (statusResponse.msg[1].lastCtrlError === 0) {
            deviceResponse = { deviceId: device.deviceId, msg: ['Success', remotePath] };
          }
        }
      } catch (err) {
        this.logger.error('Failed to write to CHA', err);
      }
      return deviceResponse;
    });
    return response;
  }

  /**
   * Run a command to the device with state changes.
   * This function will send the device state to busy, and increment device message count.
   * Additionally it will invoke the device update callback to ensure state is properly updated for the device.
   * @param device The device run state changes for.
   * @param func The function to be invoked.
   * @returns The response from the provided function.
   */
  private async runWithStateChanges<T>(device: ChaDeviceType, func: () => Promise<T>): Promise<T> {
    device.msgId++;
    device.status = DeviceStatus.Busy;
    ChaAdapter.notifyDeviceUpdate(device, this.logger);
    let response = undefined;

    try {
      response = await func();
    } catch (err) {
      device.status = DeviceStatus.Ready;
      ChaAdapter.notifyDeviceUpdate(device, this.logger);
      throw err;
    }

    device.status = DeviceStatus.Ready;
    ChaAdapter.notifyDeviceUpdate(device, this.logger);
    return response;
  }

  /**
   * Broadcast a device update to every registered callback, isolating each one so a single
   * misbehaving manager's callback can't stop the others from being notified.
   * @param device The device to broadcast the update for.
   * @param logger The logger to report a failing callback to.
   */
  private static notifyDeviceUpdate(device: ChaDeviceType, logger: Logger): void {
    for (const callback of ChaAdapter.deviceUpdateCallbacks) {
      try {
        callback(device);
      } catch (err) {
        logger.error('Device update callback failed', err);
      }
    }
  }

  /**
   * Broadcast a device disconnection to every registered callback, isolating each one so a
   * single misbehaving manager's callback can't stop the others from being notified.
   * @param deviceId The identifier of the device which disconnected.
   * @param logger The logger to report a failing callback to.
   */
  private static notifyDisconnect(deviceId: string, logger: Logger): void {
    for (const callback of ChaAdapter.disconnectCallbacks) {
      try {
        callback(deviceId);
      } catch (err) {
        logger.error('Disconnect callback failed', err);
      }
    }
  }

  /**
   * Function to wait for a response from the device.
   * A timeout occurs if a response is not received within the expected timeframe.
   * In the case of failure or response error message, undefined is returned.
   * @param device The device to wait for a response from.
   * @param identifier The message identifier for the expected response.
   * @returns The response from the device or undefined.
   */
  private async waitForResponse(
    device: ChaDeviceType,
    identifier: string,
    timeoutTimeMs: number = this.defaultTimeoutTimeMs
  ): Promise<IDeviceResponse | undefined> {
    const response = await firstValueFrom(
      ChaAdapter.responseSubject.pipe(
        skip(1),
        filter(response => response?.deviceId === device.deviceId && (response.msg[0] == identifier || response.msg[0] == 'Error')),
        timeout(timeoutTimeMs),
        catchError(() => of(undefined))
      )
    );
    if (response && response.msg[0] !== 'Error') {
      return response;
    } else {
      return undefined;
    }
  }

  /**
   * Function to wait for a response from a device with timely status updates.
   * A timeout occurs if a status update or final response is not received within the expected timeframe.
   * In the case of failure or response error message, undefined is returned.
   * @param device The device to wait for a response from.
   * @param identifier The message identifier for the expected response.
   * @param statusIdentifier The message identifier for the status responses.
   * @param statusCallback The callback for status updates.
   * @param timeout The timeout for each status update/final response, a default is used if not provided.
   * @returns The response from the device or undefined.
   */
  private async waitForResponseWithStatusUpdates(
    device: ChaDeviceType,
    identifier: string,
    statusIdentifier: string,
    statusCallback?: (response: IDeviceResponse) => void,
    timeoutMs?: number
  ): Promise<IDeviceResponse | undefined> {
    const finalResponseSubject = new Subject<IDeviceResponse | undefined>();
    const subscription = ChaAdapter.responseSubject
      .pipe(
        skip(1),
        filter(
          response =>
            response?.deviceId === device.deviceId &&
            (response.msg[0] == identifier || response.msg[0] == statusIdentifier || response.msg[0] == 'Error')
        ),
        timeout({ each: timeoutMs ?? this.defaultTimeoutTimeMs }),
        catchError(() => of(undefined))
      )
      .subscribe(response => {
        if (response === undefined || response.msg[0] === 'Error') {
          finalResponseSubject.next(undefined);
        } else if (response.msg[0] == statusIdentifier) {
          statusCallback?.(response);
        } else {
          finalResponseSubject.next(response);
        }
      });
    const finalResponse = await firstValueFrom(finalResponseSubject);
    subscription.unsubscribe();
    return finalResponse;
  }

  /**
   * Create a default invalid response for the device.
   * @param device The device to create the response for.
   * @returns The invalid response for the device.
   */
  defaultInvalidResponse(device: ChaDeviceType) {
    const response: IDeviceResponse = {
      deviceId: device.deviceId,
      msg: ['0', 'ERROR', 'Failed to write message to CHA. Make sure CHA is connected and try again.'],
    };
    return response;
  }

  /**
   * Device event listener which handles incoming responses from devices.
   * @param response The device response to handle.
   * @param logger The logger to report a failing callback to.
   */
  private static deviceEventListener(response: DeviceResponse, logger: Logger) {
    if (response.res[0] === 'Disconnected') {
      ChaAdapter.notifyDisconnect(response.name, logger);
    } else {
      ChaAdapter.responseSubject.next({ deviceId: response.name, msg: typeof response.res === 'string' ? [response.res] : response.res });
    }
  }

  /**
   * Request free space on a device.
   * @param device The device to request free space from.
   */
  async requestSdBytesFree(device: ChaDeviceType): Promise<IDeviceResponse> {
    const response = await this.runWithStateChanges<IDeviceResponse>(device, async () => {
      const nameOptions = { name: device.deviceId };
      let deviceResponse = this.defaultInvalidResponse(device);
      try {
        const waitForResponse = this.waitForResponse(device, 'SdBytesFreeReceived');
        await TabsintCha.requestSdBytesFree(nameOptions);
        deviceResponse = (await waitForResponse) ?? deviceResponse;
      } catch (err) {
        this.logger.error('Failed to write to CHA', err);
      }
      return deviceResponse;
    });
    return response;
  }

  /**
   * Request setting on a device.
   * @param device The device to request setting from.
   * @param setting The setting to be requested.
   */
  async requestSetting(device: ChaDeviceType, setting: string): Promise<IDeviceResponse> {
    const response = await this.runWithStateChanges<IDeviceResponse>(device, async () => {
      const nameOptions = { name: device.deviceId, settingName: setting };
      let deviceResponse = this.defaultInvalidResponse(device);
      try {
        const waitForResponse = this.waitForResponse(device, 'Setting');
        await TabsintCha.requestSetting(nameOptions);
        deviceResponse = (await waitForResponse) ?? deviceResponse;
      } catch (err) {
        this.logger.error('Failed to write to CHA', err);
      }
      return deviceResponse;
    });
    return response;
  }

  /**
   * write setting on a device.
   * @param device The device to write setting to.
   * @param setting The setting to be written.
   * @param value The setting value to be written.
   */
  async writeSetting(device: ChaDeviceType, setting: string, value: number): Promise<IDeviceResponse> {
    const response = await this.runWithStateChanges<IDeviceResponse>(device, async () => {
      const nameOptions = { name: device.deviceId, settingName: setting, value: value };
      let deviceResponse = this.defaultInvalidResponse(device);
      try {
        const waitForResponse = this.waitForResponse(device, 'Setting');
        await TabsintCha.writeSetting(nameOptions);
        deviceResponse = (await waitForResponse) ?? deviceResponse;
      } catch (err) {
        this.logger.error('Failed to write to CHA', err);
      }
      return deviceResponse;
    });
    return response;
  }

  /**
   * List all files in directory on a device.
   * @param device The device to list directory from.
   * @param dirName The directory to list files from.
   * @param flags Optional flags to pass to the directory request.
   */
  async getDirectory(device: ChaDeviceType, dirName: string, flags: number | undefined = undefined): Promise<IDeviceResponse> {
    const dirs: DirectoryEntryObject[] = [];
    function dirCallback(response: IDeviceResponse) {
      if (isDirectoryEntryResponse(response)) {
        dirs.push(response['msg'][1]);
      }
    }
    const response = await this.runWithStateChanges<IDeviceResponse>(device, async () => {
      let fixedDirName = dirName;
      if (dirName.endsWith('/')) {
        // weird cha behavior - returns all '00000000's for crcs if trailing '/'
        fixedDirName = dirName.slice(0, -1);
      }
      const requestDirectoryOptions = {
        name: device.deviceId,
        remotePath: fixedDirName,
        flags: flags,
      };
      let deviceResponse = this.defaultInvalidResponse(device);
      try {
        // Reading from directories can be very slow this function has a large timeout to get around this issue
        const fileOperationPromise = this.waitForResponseWithStatusUpdates(device, 'FileOperationComplete', 'DirEntry', dirCallback, 20000);
        await TabsintCha.requestDirectory(requestDirectoryOptions);
        const writeResponse = await fileOperationPromise;
        if (isSuccessfulFileOperation(writeResponse)) {
          deviceResponse = { deviceId: device.deviceId, msg: ['Success', dirs] };
        }
      } catch (err) {
        this.logger.error('Failed to write to CHA', err);
      }
      return deviceResponse;
    });
    return response;
  }

  /**
   * Get long name of file from short name.
   * @param device The device to get long file name from.
   * @param shortName The shortName of the file.
   */
  async getChaLongName(device: ChaDeviceType, shortName: string): Promise<IDeviceResponse> {
    const response = await this.runWithStateChanges<IDeviceResponse>(device, async () => {
      const getLfnFromSfnOptions = {
        name: device.deviceId,
        fullPath: shortName,
      };
      let deviceResponse = this.defaultInvalidResponse(device);
      try {
        const longFnResp = await TabsintCha.getLfnFromSfn(getLfnFromSfnOptions);
        deviceResponse = { deviceId: device.deviceId, msg: [longFnResp.value] };
      } catch (err) {
        this.logger.error('Failed to write to CHA', err);
      }
      return deviceResponse;
    });
    return response;
  }

  async copyChaFileToLocalStorageAndReadFile(device: ChaDeviceType, filename: string): Promise<IDeviceResponse> {
    const response = await this.runWithStateChanges<IDeviceResponse>(device, async () => {
      const fname = filename.split('/').at(-1)!;
      const remoteFilePath = filename;

      let deviceResponse = this.defaultInvalidResponse(device);
      try {
        await this.deleteIfExists(fname);

        const uri = await Filesystem.getUri({
          path: fname,
          directory: Directory.Data,
        });

        const startFileReadOptions = {
          name: device.deviceId,
          localFile: uri.uri.replace('file://', ''),
          remoteFile: remoteFilePath,
        };

        const waitForResponse = this.waitForResponse(device, 'FileOperationComplete', 30000);
        await TabsintCha.startFileRead(startFileReadOptions);
        await waitForResponse;

        const fileContents = await this.readFromAppStorage(fname);
        deviceResponse = { deviceId: device.deviceId, msg: [fileContents] };
      } catch (err) {
        this.logger.error('Failed to write to CHA', err);
      }
      return deviceResponse;
    });
    return response;
  }

  private async deleteIfExists(filename: string): Promise<void> {
    try {
      await Filesystem.stat({
        path: filename,
        directory: Directory.Data,
      });
      await Filesystem.deleteFile({
        path: filename,
        directory: Directory.Data,
      });
    } catch {
      // file does not exist, nothing to delete
    }
  }

  private async readFromAppStorage(filename: string): Promise<string> {
    const result = await Filesystem.readFile({
      path: filename,
      directory: Directory.Data,
      encoding: Encoding.UTF8,
    });
    return result.data as string;
  }

  /**
   * Handle for the native discovery listener, registered exactly once for the app's lifetime.
   */
  private static discoveryListenerHandle: PluginListenerHandle | undefined;

  /**
   * The discovery callback for whichever caller currently owns the scan.
   */
  private static activeDiscoveryCallback: ((response: DiscoveryResponse) => void) | undefined;

  /**
   * Whether a CHA discovery scan is currently in progress.
   */
  private static scanActive = false;

  /**
   * Start a CHA discovery scan. Registers the native discovery listener once for the app's
   * lifetime and routes each discovery event to whichever callback most recently started a scan,
   * rather than stacking a new native listener on every call. Throws if a scan is already active.
   * @param infStr The BluetoothType key to scan for.
   * @param onDiscovery Callback invoked for each discovered device while this scan is active.
   */
  async startSearch(infStr: string, onDiscovery: (response: DiscoveryResponse) => void): Promise<void> {
    if (ChaAdapter.scanActive) {
      throw new Error('A CHA device search is already in progress.');
    }
    ChaAdapter.scanActive = true;
    ChaAdapter.activeDiscoveryCallback = onDiscovery;
    try {
      ChaAdapter.discoveryListenerHandle ??= await TabsintCha.addListener('TabsintChaDiscovery', response =>
        ChaAdapter.activeDiscoveryCallback?.(response)
      );
      await TabsintCha.startChaSearch({ infStr });
    } catch (err) {
      ChaAdapter.scanActive = false;
      ChaAdapter.activeDiscoveryCallback = undefined;
      throw err;
    }
  }

  /**
   * Stop the current CHA discovery scan. A no-op if no scan is active. The lock is always
   * released, even if the native cancel call fails, so a failure here can't permanently block
   * every future search.
   */
  async stopSearch(): Promise<void> {
    if (!ChaAdapter.scanActive) {
      return;
    }
    try {
      await TabsintCha.cancelChaSearch(new Object());
    } finally {
      ChaAdapter.scanActive = false;
      ChaAdapter.activeDiscoveryCallback = undefined;
    }
  }
}
