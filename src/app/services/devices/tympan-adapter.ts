import { BleClient } from '@capacitor-community/bluetooth-le';
import { TympanDevice } from '../../models/devices/tympan-device';
import { DeviceStatus } from '../../utilities/constants';
import { BehaviorSubject, filter, firstValueFrom, skip, timeout } from 'rxjs';
import { PendingMsgInfo } from '../../interfaces/pending-msg-info.interface';
import { Command } from '../../types/custom-types';
import { IDeviceAdapter } from '../../interfaces/devices/device-adapter.interface';
import { Logger } from '../logger.service';
import { IDeviceResponse } from '../../interfaces/devices/device-response.interface';

/**
 * Tympan implementation of the device adapter.
 */
export class TympanAdapter implements IDeviceAdapter {
  /**
   * Record to hold whether a device should be accumulating response bytes.
   * The device identifier acts as the record key.
   */
  private ACCUMULATE_BYTES: Record<string, boolean> = {};

  /**
   * Behavioral subject which emits a record holding whether an initial byte has been received for a device after being written to.
   * The device identifier acts as the record key.
   */
  private readonly firstByteReceivedSubject = new BehaviorSubject<Record<string, boolean>>({});

  /**
   * Record to hold the last time a byte has been received for a device being written to.
   * The device identifier acts as the record key.
   */
  private lastByteReceived: Record<string, number> = {};

  /**
   * Record to hold response bytes for each device as accumulated.
   * The device identifier acts as the record key.
   */
  private TMP_BUFFER: Record<string, DataView> = {};

  /**
   * The BLE service UUID for Tympan devices.
   */
  readonly ADAFRUIT_SERVICE_UUID = 'BC2F4CC6-AAEF-4351-9034-D66268E328F0'; // custom tympan service

  /**
   * The BLE characteristic UUID for Tympan devices.
   */
  readonly ADAFRUIT_CHARACTERISTIC_UUID = '06D1E5E7-79AD-4A71-8FAA-373789F7D93C'; // custom tympan characteristic

  /**
   * The default error message for Tympan devices.
   */
  private readonly defaultErrorMsg: string[] = ['ERROR', 'Failed to write message to tympan. Make sure Tympan is connected and try again.'];

  /**
   * The default timeout for initial byte responses (milliseconds).
   * TODO: This value should be lowered to expect quicker responses.
   */
  private readonly defaultTimeoutTimeMs = 10000;

  /**
   * The CRC table for creating checksums.
   */
  private readonly CRC8_TABLE = this.genCRC8Table();

  /**
   * The default timeout for between byte responses (milliseconds).
   */
  private readonly innerByteTimeout = 1000;

  /**
   * The default timeout for first byte responses (milliseconds).
   * TODO: This value should be lowered to expect quicker responses.
   */
  private readonly firstByteTimeout = 500;

  /**
   * Behavioral subject which emits message responses for all devices.
   */
  private readonly tympanResponseSubject = new BehaviorSubject<IDeviceResponse | undefined>(undefined);

  /**
   * Callback invoked when a disconnection event occurs for the given device identifier.
   */
  private onDisconnect: ((id: string) => void) | undefined;

  /**
   * Callback invoked when a device property needs to be updated for the given device.
   */
  private onDeviceUpdate: ((device: TympanDevice) => void) | undefined;

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
  setDeviceUpdate(onDeviceUpdate: (device: TympanDevice) => void) {
    this.onDeviceUpdate = onDeviceUpdate;
  }

  /**
   * Connect to the device.
   * @param device The device to be connected to.
   */
  async connect(device: TympanDevice): Promise<void> {
    await BleClient.connect(device.deviceId, this.onDisconnect?.bind(this));
    this.clearTMPBuffer(device);
    await BleClient.startNotifications(device.deviceId, this.ADAFRUIT_SERVICE_UUID, this.ADAFRUIT_CHARACTERISTIC_UUID, (dv: DataView) => {
      this.handleIncomingBytes(device, dv);
    });
    const maxByteLength = await this.getMaxByteLength(device);
    device.maxByteLength = maxByteLength - 3; // max byte length is MTU -3
    this.onDeviceUpdate?.(device);
    this.logger.debug('Connected to device:' + JSON.stringify(device));
  }

  /**
   * Disconnect from the device.
   * @param device The device to be disconnected from.
   */
  async disconnect(device: TympanDevice) {
    await BleClient.disconnect(device.deviceId);
    this.logger.debug('Disconnected from device:' + JSON.stringify(device));
  }

  /**
   * Request a device identifier.
   * @param device The device to request the identifier from.
   */
  async requestId(device: TympanDevice): Promise<IDeviceResponse> {
    const respMsg = await this.runWithStateChanges<unknown[]>(device, async () => {
      const msgId = String(device.msgId);
      let respMsg: unknown[] = [String(-msgId)].concat(structuredClone(this.defaultErrorMsg));
      const msg = '[' + msgId + ',"requestId"]';
      const currentCommand = {
        func: this.requestId.bind(this, device),
        name: 'Request ID',
      };
      try {
        const maxByteLength = device.maxByteLength;
        const waitForResponse = this.waitForResponse(device, currentCommand);
        await this.write(device, msg, maxByteLength);
        respMsg = (await waitForResponse)?.msg ?? respMsg;
        respMsg = this.handleTimeoutErrors(respMsg, msgId);
      } catch (err) {
        this.logger.error('Failed to write to tympan with msg: ' + JSON.stringify(msg), err);
      }
      return respMsg;
    });
    return { deviceId: device.deviceId, msg: respMsg };
  }

  /**
   * Queue an exam for a device.
   * @param device The device to queue the exam for.
   * @param examId The identifier of the exam to be queued.
   * @param examProperties Object holding properties related to the exam.
   */
  async queueExam(device: TympanDevice, examType: string, examProperties: object): Promise<IDeviceResponse> {
    const respMsg = await this.runWithStateChanges<unknown[]>(device, async () => {
      const msgId = String(device.msgId);
      let respMsg: unknown[] = [String(-msgId)].concat(structuredClone(this.defaultErrorMsg));
      const examId = '1';
      const msg = '[' + msgId + ',"queueExam",' + examId + ',"' + examType + '",' + JSON.stringify(examProperties) + ']';
      const currentCommand = {
        func: this.queueExam.bind(this, device, examType, examProperties),
        name: 'Queue Exam',
      };
      try {
        const maxByteLength = device.maxByteLength;
        const waitForResponse = this.waitForResponse(device, currentCommand);
        await this.write(device, msg, maxByteLength);
        respMsg = (await waitForResponse)?.msg ?? respMsg;
        respMsg = this.handleTimeoutErrors(respMsg, msgId);
      } catch (err) {
        this.logger.error('Failed to write to tympan with msg: ' + JSON.stringify(msg), err);
      }
      return respMsg;
    });
    return { deviceId: device.deviceId, msg: respMsg };
  }

  /**
   * Submit an exam submission for a device.
   * @param device The device which the submission will be sent to.
   * @param examProperties Object holding properties related to the exam.
   * @param ignoreErrors A list of keywords for which matching errors will be ignored.
   */
  async examSubmission(device: TympanDevice, examProperties: object, ignoreErrors: string[]): Promise<IDeviceResponse> {
    const respMsg = await this.runWithStateChanges<unknown[]>(device, async () => {
      const msgId = String(device.msgId);
      let respMsg: unknown[] = [String(-msgId)].concat(structuredClone(this.defaultErrorMsg));
      const examId = '1';
      const msg = '[' + msgId + ',"examSubmission",' + examId + ',' + JSON.stringify(examProperties) + ']';
      const currentCommand = {
        func: this.examSubmission.bind(this, device, examProperties, ignoreErrors),
        name: 'Exam Submission',
      };
      try {
        const maxByteLength = device.maxByteLength;
        const waitForResponse = this.waitForResponse(device, currentCommand);
        await this.write(device, msg, maxByteLength);
        respMsg = (await waitForResponse)?.msg ?? respMsg;
        respMsg = this.handleTimeoutErrors(respMsg, msgId);
      } catch (err) {
        this.logger.error('Failed to write to tympan with msg: ' + JSON.stringify(msg), err);
      }
      return respMsg;
    });
    return { deviceId: device.deviceId, msg: respMsg };
  }

  /**
   * Abort an exam for a device.
   * @param device The device to abort the exam for.
   */
  async abortExams(device: TympanDevice): Promise<IDeviceResponse> {
    const respMsg = await this.runWithStateChanges<unknown[]>(device, async () => {
      const msgId = String(device.msgId);
      let respMsg: unknown[] = [String(-msgId)].concat(structuredClone(this.defaultErrorMsg));
      const msg = '[' + msgId + ',"abortExams"]';
      const currentCommand = {
        func: this.abortExams.bind(this, device),
        name: 'Abort Exam',
      };
      try {
        const maxByteLength = device.maxByteLength;
        const waitForResponse = this.waitForResponse(device, currentCommand);
        await this.write(device, msg, maxByteLength);
        respMsg = (await waitForResponse)?.msg ?? respMsg;
        respMsg = this.handleTimeoutErrors(respMsg, msgId);
      } catch (err) {
        this.logger.error('Failed to write to tympan with msg: ' + JSON.stringify(msg), err);
      }
      return respMsg;
    });
    return { deviceId: device.deviceId, msg: respMsg };
  }

  /**
   * Request results from an exam for a device.
   * @param device The device to request exam results from.
   * @param examId The identifier of the exam to request results for.
   */
  async requestResults(device: TympanDevice, timeoutTimeMs: number = this.defaultTimeoutTimeMs): Promise<IDeviceResponse> {
    const respMsg = await this.runWithStateChanges<unknown[]>(device, async () => {
      const msgId = String(device.msgId);
      let respMsg: unknown[] = [String(-msgId)].concat(structuredClone(this.defaultErrorMsg));
      const examId = '1';
      const msg = '[' + device.msgId + ',"requestResults",' + examId + ']';
      const currentCommand = {
        func: this.requestResults.bind(this, device, timeoutTimeMs),
        name: 'Request Results',
      };
      try {
        const maxByteLength = device.maxByteLength;
        const waitForResponse = this.waitForResponse(device, currentCommand, timeoutTimeMs);
        await this.write(device, msg, maxByteLength);
        respMsg = (await waitForResponse)?.msg ?? respMsg;
        respMsg = this.handleTimeoutErrors(respMsg, msgId);
      } catch (err) {
        this.logger.error('Failed to write to tympan with msg: ' + JSON.stringify(msg), err);
      }
      return respMsg;
    });
    return { deviceId: device.deviceId, msg: respMsg };
  }

  /**
   * Function to wait for a response from the device.
   * A timeout occurs if a first byte is not received within the expected timeframe,
   * or if the response is not valid. In the case of failure a retry command is run.
   * @param device The device to wait for a response from.
   * @param retryCommand The retry command to run on failure.
   * @param timeoutTimeMs The timeout to wait for a response to be received.
   * @returns The response from the device or undefined.
   */
  private async waitForResponse(
    device: TympanDevice,
    retryCommand: Command,
    timeoutTimeMs: number = this.defaultTimeoutTimeMs
  ): Promise<IDeviceResponse | undefined> {
    try {
      // Await for a first byte or until the a timeout error is thrown
      await firstValueFrom(
        this.firstByteReceivedSubject.pipe(
          skip(1),
          filter(response => response[device.deviceId]),
          timeout(this.firstByteTimeout)
        )
      );
      const response = await firstValueFrom(
        this.tympanResponseSubject.pipe(
          skip(1),
          filter(response => response?.deviceId === device.deviceId),
          timeout(timeoutTimeMs)
        )
      );
      if (response && this.isResponseInvalidChecksum(response)) {
        return await retryCommand.func();
      } else if (response && this.doTympanResponseMsgIdsMatch({ deviceId: device.deviceId, msgId: String(device.msgId) }, response)) {
        return response;
      } else {
        return undefined;
      }
    } catch (err) {
      this.logger.debug('Error while waiting for a device response', err);
      return undefined;
    }
  }

  /**
   * Write to the device.
   * @param device The device to be written to.
   * @param msg The message string to write to the device.
   * @param chunkSize The chunk size used to break up the message.
   */
  private async write(device: TympanDevice, msg: string, chunkSize: number) {
    const msg_to_write = this.msgToDataView(msg);
    this.logger.debug('Writing message to tympan: ' + msg);
    const original_msg_buffer: ArrayBufferLike = msg_to_write.buffer;
    const byteOffset: number = msg_to_write.byteOffset;
    const byteLength: number = msg_to_write.byteLength;
    let currentOffset: number = byteOffset;
    while (currentOffset < byteOffset + byteLength) {
      const currChunkLength = Math.min(chunkSize, byteOffset + byteLength - currentOffset);
      const chunkDataView = new DataView(original_msg_buffer, currentOffset, currChunkLength);
      await BleClient.write(device.deviceId, this.ADAFRUIT_SERVICE_UUID, this.ADAFRUIT_CHARACTERISTIC_UUID, chunkDataView);
      currentOffset += currChunkLength;
    }
  }

  /**
   * Get the maximum acceptable chunk size for the device.
   * @param device The device to determine chunk size for.
   * @returns The maximum chunk size for the device.
   */
  private async getMaxByteLength(device: TympanDevice): Promise<number> {
    const maxByteLength = await BleClient.getMtu(device.deviceId);
    return maxByteLength;
  }

  /**
   * Handles reading incoming bytes from the device.
   * @param device The device to read from.
   * @param dv A data view of the incoming message from the device.
   */
  private handleIncomingBytes(device: TympanDevice, dv: DataView) {
    const byteArray = new Uint8Array(dv.buffer.slice(dv.byteOffset, dv.byteOffset + dv.byteLength));
    const byteArrayLength = byteArray.length;

    // Loop through every byte
    for (let i = 0; i < byteArrayLength; i++) {
      const byteArr = byteArray.slice(i, i + 1);
      // check for a start character to begin accumulating bytes
      if (byteArr[0] == 5) {
        if (this.ACCUMULATE_BYTES[device.deviceId] === true) {
          this.clearTMPBuffer(device);
        }
        this.startAccumulatingBytes(device);
      }

      // accumulate bytes
      if (this.ACCUMULATE_BYTES[device.deviceId] === true) {
        this.addBytesToBuffer(device, new DataView(byteArr.buffer));

        // check for a completed msg (last byte in buffer is a 2)
        if (this.TMP_BUFFER[device.deviceId].getUint8(this.TMP_BUFFER[device.deviceId].buffer.byteLength - 1) == 2) {
          const msg = this.parseCompletedMsg(device);
          this.tympanResponseSubject.next({ deviceId: device.deviceId, msg: msg });
          this.stopAccumulatingBytes(device);
        }
      }
    }
  }

  /**
   * Function to check if bytes are being accumulated and append a timeout response if not.
   * @param device The device to check byte accumulation for.
   */
  private innerByteChecker(device: TympanDevice) {
    if (this.ACCUMULATE_BYTES[device.deviceId] === true) {
      if (Date.now() - this.lastByteReceived[device.deviceId] > this.innerByteTimeout) {
        const msg = ['byte timeout'];
        this.tympanResponseSubject.next({ deviceId: device.deviceId, msg: msg });
        this.stopAccumulatingBytes(device);
      } else {
        setTimeout(this.innerByteChecker.bind(this, device), 100);
      }
    }
  }

  /**
   * Starts the byte accumulation for a device, to ensure the device is responding properly.
   * @param device The device to start byte accumulation for.
   */
  private startAccumulatingBytes(device: TympanDevice) {
    this.ACCUMULATE_BYTES[device.deviceId] = true;
    const firstByteReceived = this.firstByteReceivedSubject.getValue();
    firstByteReceived[device.deviceId] = true;
    this.firstByteReceivedSubject.next(firstByteReceived);
    this.lastByteReceived[device.deviceId] = Date.now();
    this.innerByteChecker(device);
  }

  /**
   * Stop the byte accumulation for a device.
   * @param device The device to stop byte accumulation for.
   */
  private stopAccumulatingBytes(device: TympanDevice) {
    // TODO: Should we always clear with this call?
    this.clearTMPBuffer(device);
    const firstByteReceived = this.firstByteReceivedSubject.getValue();
    firstByteReceived[device.deviceId] = false;
    this.firstByteReceivedSubject.next(firstByteReceived);
    this.ACCUMULATE_BYTES[device.deviceId] = false;
  }

  /**
   * Add bytes to the response buffer.
   * @param device The device to be added for.
   * @param dv A data view of the incoming message from the device.
   */
  private addBytesToBuffer(device: TympanDevice, dv: DataView) {
    this.TMP_BUFFER[device.deviceId] = this.appendDataView(this.TMP_BUFFER[device.deviceId], dv);
    this.lastByteReceived[device.deviceId] = Date.now();
  }

  /**
   * Adjust the response message in the case of errors to a standard error format.
   * @param respMsg The response to be adjusted.
   * @param msgId The identifier of the response.
   * @returns The adjusted response.
   */
  private handleTimeoutErrors(respMsg: unknown[], msgId: string): unknown[] {
    let respMsgUpdated = respMsg;
    if (respMsg.length === 0) {
      respMsgUpdated = [String(-msgId), 'ERROR', 'timeout'];
    } else if (JSON.stringify(respMsg).includes('byte timeout')) {
      respMsgUpdated = [String(-msgId), 'ERROR', 'byte timeout'];
    }
    return respMsgUpdated;
  }

  /**
   * Check if the response includes an invalid checksum message.
   * @param response The response to be checked.
   * @returns Whether the response includes an invalid checksum message.
   */
  private isResponseInvalidChecksum(response: IDeviceResponse): boolean {
    if (JSON.stringify(response.msg).includes('invalid checksum')) {
      return true;
    } else {
      return false;
    }
  }

  /**
   * Check if the response identifier matches the expected message identifier.
   * @param expectedMsgInfo The expected message information.
   * @param response The response from the device.
   * @returns Whether the response identifier matches the expected message identifier.
   */
  private doTympanResponseMsgIdsMatch(expectedMsgInfo: PendingMsgInfo | null, response: IDeviceResponse): boolean {
    let resp = false;
    if (expectedMsgInfo!.deviceId === response.deviceId) {
      if (
        JSON.stringify(response.msg).includes('byte timeout') ||
        -Number.parseInt(expectedMsgInfo!.msgId) === Number.parseInt(String(response.msg[0]))
      ) {
        resp = true;
      }
    }
    return resp;
  }

  /**
   * Format a byte array into hex format.
   * @param byteArray The byte array to be formatted.
   * @returns The hex array representation of the byte array as a string.
   */
  private formatHexArray(byteArray: Uint8Array): string {
    const hexArray: string[] = Array.from(byteArray, byte => `0x${byte.toString(16).padStart(2, '0').toUpperCase()}`);
    return `[${hexArray.join(', ')}]`;
  }

  /**
   * Format a message string into a data view.
   * @param str The string to be formatted.
   * @returns The data view representation of the string.
   */
  private msgToDataView(str: string): DataView {
    const start_byte = new Uint8Array([5]);
    const end_byte = new Uint8Array([2]);
    const buf = new TextEncoder().encode(str); // this is a uint8array!
    const crc = this.genCRC8Checksum(buf);
    const msgToSend = new Uint8Array([...start_byte, ...this.handleEscaping(buf), ...this.handleEscaping(crc), ...end_byte]);
    return new DataView(msgToSend.buffer);
  }

  /**
   * Check if the byte array contains unhandled sequences.
   * @param byteArray The byte array to check.
   * @returns Whether the byte array contains unhandled sequences.
   */
  private isUnhandledByteMessage(byteArray: Uint8Array): boolean {
    let unhandled_byte = false;
    const exactUnhandledSequences = [
      [0x55, 0x6e, 0x68, 0x61, 0x6e, 0x64, 0x6c, 0x65, 0x64, 0x20, 0x62, 0x79, 0x74, 0x65, 0x20, 0x72, 0x65, 0x63], // "Unhandled byte rec"
      [0x0a], // Single newline byte
    ];
    const partialUnhandledSequences = [
      [0x65, 0x69, 0x76, 0x65, 0x64, 0x3a, 0x20, 0x27, 0x5c, 0x78], // "eived: '\x" - NOTE: will be 2-3 more bytes ?(?)' after
    ];

    if (exactUnhandledSequences.some(seq => this.arrayEquals(byteArray, seq))) {
      unhandled_byte = true;
    }
    partialUnhandledSequences.forEach(arr => {
      if (byteArray.length >= arr.length) {
        if (this.arrayEquals(byteArray.slice(0, arr.length), arr)) {
          unhandled_byte = true;
        }
      }
    });

    return unhandled_byte;
  }

  /**
   * Check if an unsigned 8-bit integer array has matching order and values to a number array.
   * @param a The unsigned 8-bit integer array.
   * @param b The number array.
   * @returns Whether the two arrays have matching order and values.
   */
  private arrayEquals(a: Uint8Array, b: number[]): boolean {
    return a.length === b.length && a.every((val, index) => val === b[index]);
  }

  /**
   * Parse the device response buffer as a completed message.
   * @param device The device to parse the response for.
   * @returns The complete parsed message or an invalid checksum response.
   */
  private parseCompletedMsg(device: TympanDevice): string[] {
    const dv = this.TMP_BUFFER[device.deviceId];
    let msg: string[];

    const tmp = new Uint8Array(dv.buffer.slice(0));
    const unescapedArray = this.handleUnescaping(tmp.slice(1, tmp.byteLength - 1));
    const crc = unescapedArray.slice(unescapedArray.byteLength - 1);
    const expectedChecksum = this.genCRC8Checksum(unescapedArray.slice(0, unescapedArray.byteLength - 1));
    if (crc[0] == expectedChecksum[0]) {
      const tmpDV = new DataView(unescapedArray.slice(0, unescapedArray.byteLength - 1).buffer);
      msg = JSON.parse(this.dataViewToString(tmpDV));
    } else {
      msg = ['invalid checksum'];
    }

    return msg;
  }

  /**
   * Clear the response buffer for the device.
   * @param device The device to clear the response buffer for.
   */
  private clearTMPBuffer(device: TympanDevice) {
    this.TMP_BUFFER[device.deviceId] = new DataView(new ArrayBuffer(0));
  }

  /**
   * Converts a data view to a string format.
   * @param dv The data view to be converted.
   * @returns The data view as a string.
   */
  private dataViewToString(dv: DataView): string {
    return new TextDecoder().decode(dv.buffer);
  }

  /**
   * Add data to a data view.
   * @param dv1 The data view to be added to.
   * @param dv2 The data view to be added.
   * @returns A new data view with the second data view appended to the first.
   */
  private appendDataView(dv1: DataView, dv2: DataView): DataView {
    const tmp = new Uint8Array(dv1.buffer.byteLength + dv2.buffer.byteLength);
    tmp.set(new Uint8Array(dv1.buffer), 0);
    tmp.set(new Uint8Array(dv2.buffer), dv1.buffer.byteLength);
    return new DataView(tmp.buffer);
  }

  /**
   * Adds escape characters to a byte array.
   * @param byte_array The byte array to be escaped.
   * @returns A new byte array with escape characters added.
   */
  private handleEscaping(byte_array: Uint8Array): Uint8Array {
    let escaped_byte_array: Uint8Array = new Uint8Array();
    byte_array.forEach(byte => {
      if (byte <= 31) {
        escaped_byte_array = new Uint8Array([...escaped_byte_array, ...[3, 128 ^ byte]]);
      } else {
        escaped_byte_array = new Uint8Array([...escaped_byte_array, ...[byte]]);
      }
    });
    return escaped_byte_array;
  }

  /**
   * Remove escape characters from a byte array.
   * @param byte_array The byte array to be unescaped.
   * @returns A new byte array with escape characters removed.
   */
  private handleUnescaping(byte_array: Uint8Array) {
    let unescaped_byte_array: Uint8Array = new Uint8Array();
    let esc_next = false;
    byte_array.forEach((byte: number) => {
      if (!esc_next) {
        if (byte == 3) {
          esc_next = true;
        } else {
          unescaped_byte_array = new Uint8Array([...unescaped_byte_array, ...[byte]]);
        }
      } else {
        unescaped_byte_array = new Uint8Array([...unescaped_byte_array, ...[byte ^ 128]]);
        esc_next = false;
      }
    });
    return unescaped_byte_array;
  }

  /**
   * Create a CRC checksum for a byte array.
   * @param byte_array The byte array to create the CRC checksum for.
   * @returns The CRC checksum.
   */
  private genCRC8Checksum(byte_array: Uint8Array) {
    let c = 0;
    byte_array.forEach(byte => {
      c = this.CRC8_TABLE[(c ^ byte) % 256];
    });
    return new Uint8Array([c]);
  }

  /**
   * Generate the checksum table for creating CRC checksums.
   * @returns The checksum table.
   */
  private genCRC8Table() {
    const csTable = []; // 256 max len byte array
    for (let i = 0; i < 256; ++i) {
      let curr = i;
      for (let j = 0; j < 8; ++j) {
        if ((curr & 0x80) !== 0) {
          curr = ((curr << 1) ^ 0x07) % 256;
        } else {
          curr = (curr << 1) % 256;
        }
      }
      csTable[i] = curr;
    }
    return csTable;
  }

  /**
   * Run a command to the device with state changes.
   * This function will send the device state to busy, and increment device message count.
   * Additionally it will invoke the device update callback to ensure state is properly updated for the device.
   * @param device The device run state changes for.
   * @param func The function to be invoked.
   * @returns The response from the provided function.
   */
  private async runWithStateChanges<T>(device: TympanDevice, func: () => Promise<T>): Promise<T> {
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
}
