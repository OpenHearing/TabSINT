import { DeviceStatus } from '../../utilities/constants';
import { IDeviceAdapter } from '../../interfaces/devices/device-adapter.interface';
import { Logger } from '../logger.service';
import { IDeviceResponse } from '../../interfaces/devices/device-response.interface';
import { WahtsDevice } from '../../models/devices/wahts-device';
import { DeviceResponse, TabsintCha } from 'tabsintcha';
import { BehaviorSubject, catchError, filter, firstValueFrom, of, skip, Subject, timeout } from 'rxjs';
import { FirmwareAsset } from '../../interfaces/firmware-asset.interface';
import { isValidDeviceResponse } from '../../guards/type.guard';

/**
 * WAHTS implementation of the device adapter.
 */
export class WahtsAdapter implements IDeviceAdapter {
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
  private onDeviceUpdate: ((device: WahtsDevice) => void) | undefined;

  constructor(private readonly logger: Logger) {}

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
  setDeviceUpdate(onDeviceUpdate: (device: WahtsDevice) => void) {
    this.onDeviceUpdate = onDeviceUpdate;
  }

  /**
   * Connect to the device.
   * @param device The device to be connected to.
   */
  async connect(device: WahtsDevice): Promise<void> {
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
  async disconnect(device: WahtsDevice) {
    const nameOptions = { name: device.deviceId };
    await TabsintCha.disconnect(nameOptions);
    await TabsintCha.stopListener(nameOptions);
  }

  /**
   * Request a device identifier.
   * @param device The device to request the identifier from.
   */
  async requestId(device: WahtsDevice): Promise<IDeviceResponse> {
    const response = await this.runWithStateChanges<IDeviceResponse>(device, async () => {
      const nameOptions = { name: device.deviceId };
      const waitForResponse = this.waitForResponse(device, 'Id');
      await TabsintCha.requestId(nameOptions);
      return (await waitForResponse) ?? this.defaultInvalidResponse(device);
    });
    return response;
  }

  /**
   * Queue an exam for a device.
   * @param device The device to queue the exam for.
   * @param examId The identifier of the exam to be queued.
   * @param examProperties Object holding properties related to the exam.
   */
  async queueExam(device: WahtsDevice, examType: string, examProperties: object): Promise<IDeviceResponse> {
    const response = await this.runWithStateChanges<IDeviceResponse>(device, async () => {
      const queueExamOptions = { name: device.deviceId, examName: examType, params: examProperties };
      const msg = await TabsintCha.queueExam(queueExamOptions);
      const resp: IDeviceResponse = { deviceId: device.deviceId, msg: [msg] };
      return resp;
    });
    return response;
  }

  /**
   * Submit an exam submission for a device.
   * @param device The device which the submission will be sent to.
   * @param examProperties Object holding properties related to the exam.
   * @param ignoreErrors A list of keywords for which matching errors will be ignored.
   */
  async examSubmission(device: WahtsDevice, examProperties: object, ignoreErrors: string[]): Promise<IDeviceResponse> {
    const response = await this.runWithStateChanges<IDeviceResponse>(device, async () => {
      const examSubmissionOptions = { name: device.deviceId, submissionName: (examProperties as { name: string }).name, params: examProperties };
      const msg = await TabsintCha.examSubmission(examSubmissionOptions);
      const resp: IDeviceResponse = { deviceId: device.deviceId, msg: [msg] };
      return resp;
    });
    return response;
  }

  /**
   * Abort an exam for a device.
   * @param device The device to abort the exam for.
   */
  async abortExams(device: WahtsDevice): Promise<IDeviceResponse> {
    const response = await this.runWithStateChanges<IDeviceResponse>(device, async () => {
      const nameOptions = { name: device.deviceId };
      const msg = await TabsintCha.abortExams(nameOptions);
      const resp: IDeviceResponse = { deviceId: device.deviceId, msg: [msg] };
      return resp;
    });
    return response;
  }

  /**
   * Request results from an exam for a device.
   * @param device The device to request exam results from.
   * @param examId The identifier of the exam to request results for.
   */
  async requestResults(device: WahtsDevice, timeoutTimeMs: number = this.defaultTimeoutTimeMs): Promise<IDeviceResponse> {
    const response = await this.runWithStateChanges<IDeviceResponse>(device, async () => {
      const nameOptions = { name: device.deviceId };
      const waitForResponse = this.waitForResponse(device, 'Result');
      await TabsintCha.requestResults(nameOptions);
      return (await waitForResponse) ?? this.defaultInvalidResponse(device);
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
    device: WahtsDevice,
    firmwareAsset: FirmwareAsset,
    progressCallback?: (progress: IDeviceResponse) => void
  ): Promise<IDeviceResponse> {
    const response = await this.runWithStateChanges<IDeviceResponse>(device, async () => {
      const startFirmwareWriteOptions = { name: device.deviceId, localFile: firmwareAsset.filePath, remoteFile: 'CHA_PROG.dat', flags: 0 };
      const writeResponsePromise = this.waitForResponseWithStatusUpdates(device, 'FileOperationComplete', 'FileProgress', progressCallback, 10000);
      await TabsintCha.startFileWrite(startFirmwareWriteOptions);
      const writeResponse = await writeResponsePromise;

      let reprogramResponse: IDeviceResponse | undefined = undefined;
      if (isValidDeviceResponse(writeResponse)) {
        const reprogramOptions = { name: device.deviceId, crc32: firmwareAsset.checksum };
        const msg = await TabsintCha.reprogram(reprogramOptions);
        reprogramResponse = { deviceId: device.deviceId, msg: [msg] };
      }
      return reprogramResponse ?? this.defaultInvalidResponse(device);
    });
    return response;
  }

  /**
   * Reboot a device.
   * @param device The device to reboot.
   * @returns The device response for the reboot operation.
   */
  async reboot(device: WahtsDevice): Promise<IDeviceResponse> {
    const response = await this.runWithStateChanges<IDeviceResponse>(device, async () => {
      const rebootOptions = { name: device.deviceId };
      const msg = await TabsintCha.reboot(rebootOptions);
      const resp: IDeviceResponse = { deviceId: device.deviceId, msg: [msg] };
      return resp;
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
  private async runWithStateChanges<T>(device: WahtsDevice, func: () => Promise<T>): Promise<T> {
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
  private async waitForResponse(device: WahtsDevice, identifier: string): Promise<IDeviceResponse | undefined> {
    const response = await firstValueFrom(
      this.responseSubject.pipe(
        skip(1),
        filter(response => response?.deviceId === device.deviceId && (response.msg[0] == identifier || response.msg[0] == 'Error')),
        timeout(this.defaultTimeoutTimeMs),
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
    device: WahtsDevice,
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
  private defaultInvalidResponse(device: WahtsDevice) {
    const response: IDeviceResponse = { deviceId: device.deviceId, msg: ['ERROR'] };
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
}
