import { ChaDeviceType, DeviceStatus } from '../../utilities/constants';
import { IDeviceAdapter } from '../../interfaces/devices/device-adapter.interface';
import { Logger } from '../logger.service';
import { IDeviceResponse } from '../../interfaces/devices/device-response.interface';
import { DeviceResponse, TabsintCha } from 'tabsintcha';
import { BehaviorSubject, catchError, filter, firstValueFrom, of, skip, Subject, timeout } from 'rxjs';
import { FirmwareAsset } from '../../interfaces/firmware-asset.interface';
import { isValidDeviceResponse } from '../../guards/type.guard';
import { inject } from '@angular/core';
import { Directory, Filesystem, Encoding } from '@capacitor/filesystem';

/**
 * CHA base device adapter.
 */
export class ChaAdapter implements IDeviceAdapter {
  private readonly logger = inject(Logger);

  /**
   * Behavioral subject which emits message responses for all devices.
   */
  private readonly responseSubject = new BehaviorSubject<IDeviceResponse | undefined>(undefined);

  /**
   * The default timeout for responses (milliseconds).
   */
  private readonly defaultTimeoutTimeMs = 3000;

  /**
   * Whether a device listener has been set for CHA plugin.
   */
  private isDeviceListenerSet = false;

  /**
   * Callback invoked when a disconnection event occurs for the given device identifier.
   */
  private onDisconnect: ((id: string) => void) | undefined;

  /**
   * Callback invoked when a device property needs to be updated for the given device.
   */
  private onDeviceUpdate: ((device: ChaDeviceType) => void) | undefined;

  /**
   * Set the callback for disconnection events.
   * @param disconnectCallback The callback for disconnect events.
   */
  setDisconnectCallback(disconnectCallback: (id: string) => void) {
    this.onDisconnect = disconnectCallback;
  }

  /**
   * Set the callback for device update events.
   * @param onDeviceUpdate The callback for device state change events.
   */
  setDeviceUpdate(onDeviceUpdate: (device: ChaDeviceType) => void) {
    this.onDeviceUpdate = onDeviceUpdate;
  }

  /**
   * Connect to the device.
   * @param device The device to be connected to.
   */
  async connect(device: ChaDeviceType): Promise<void> {
    if (!this.isDeviceListenerSet) {
      await TabsintCha.addListener('TabsintChaDevice', response => this.deviceEventListener(response));
      this.isDeviceListenerSet = true;
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
      const examSubmissionOptions = { name: device.deviceId, submissionName: (examProperties as { name: string }).name, params: examProperties };
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
   * @param examId The identifier of the exam to request results for.
   */
  async requestResults(device: ChaDeviceType, timeoutTimeMs: number = this.defaultTimeoutTimeMs): Promise<IDeviceResponse> {
    const response = await this.runWithStateChanges<IDeviceResponse>(device, async () => {
      const nameOptions = { name: device.deviceId };
      let deviceResponse = this.defaultInvalidResponse(device);
      try {
        const waitForResponse = this.waitForResponse(device, 'Result');
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
        if (isValidDeviceResponse(writeResponse)) {
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
    this.onDeviceUpdate?.(device);
    let response = undefined;

    try {
      response = await func();
    } catch (err) {
      device.status = DeviceStatus.Ready;
      this.onDeviceUpdate?.(device);
      throw err;
    }

    device.status = DeviceStatus.Ready;
    this.onDeviceUpdate?.(device);
    return response;
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
      this.responseSubject.pipe(
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
    const subscription = this.responseSubject
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
  private defaultInvalidResponse(device: ChaDeviceType) {
    const response: IDeviceResponse = {
      deviceId: device.deviceId,
      msg: ['0', 'ERROR', 'Failed to write message to CHA. Make sure CHA is connected and try again.'],
    };
    return response;
  }

  /**
   * Device event listener which handles incoming responses from devices.
   * @param response The device response to handle.
   */
  private deviceEventListener(response: DeviceResponse) {
    if (response.res[0] === 'Disconnected') {
      this.onDisconnect?.(response.name);
    } else {
      this.responseSubject.next({ deviceId: response.name, msg: typeof response.res === 'string' ? [response.res] : response.res });
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
   * List all files in directory on a device.
   * @param device The device to list directory from.
   * @param dirName The directory to list files from.
   */
  async getDirectory(device: ChaDeviceType, dirName: string): Promise<IDeviceResponse> {
    const dirs: string[] = [];
    function dirCallback(response: IDeviceResponse) {
      dirs.push((response as any)['msg'][1]['Path']);
    }
    const response = await this.runWithStateChanges<IDeviceResponse>(device, async () => {
      const requestDirectoryOptions = {
        name: device.deviceId,
        remotePath: dirName,
        flags: undefined,
      };
      let deviceResponse = this.defaultInvalidResponse(device);
      try {
        const fileOperationPromise = this.waitForResponseWithStatusUpdates(device, 'FileOperationComplete', 'DirEntry', dirCallback);
        await TabsintCha.requestDirectory(requestDirectoryOptions);
        await fileOperationPromise;
        deviceResponse = { deviceId: device.deviceId, msg: ['Success', dirs] };
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
        console.log('fileContents', fileContents);
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
}
