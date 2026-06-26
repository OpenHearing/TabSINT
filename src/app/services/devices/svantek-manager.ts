import { BehaviorSubject, Observable, map } from 'rxjs';
import { IDeviceManager } from '../../interfaces/devices/device-manager.interface';
import { BleClient, ScanResult } from '@capacitor-community/bluetooth-le';
import { SvantekDevice } from '../../models/devices/svantek-device';
import { DeviceState, DialogType } from '../../utilities/constants';
import { StateModel } from '../../models/state/state.service';
import { Notifications } from '../notifications.service';
import { TranslocoService } from '@jsverse/transloco';
import { Tasks } from '../tasks.service';
import { Logger } from '../logger.service';
import { inject, NgZone } from '@angular/core';
import { SavedDevice } from '../../models/disk/disk.interface';
import { ISvantekDevice } from '../../interfaces/devices/svantek-device.interface';
import { SvantekResultInterface } from '../../interfaces/svantek-result.interface';
import { IDevice } from '../../interfaces/devices/device.interface';

const SERVICE_UUID = '0bd51666-e7cb-469b-8e4d-2742f1ba77cc';
const CHAR_EXCHANGE_UUID = 'e7add780-b042-4876-aae1-112855353cc1';
const CHAR_START_UUID = '014e3c91-3326-488d-a20a-a2963d5984cc';
const CHAR_PIN_UUID = '15da06a2-c25f-4f20-ad8f-5c2e992fba76';
const DEVICE_NAME_FILTERS = ['SV 104A', 'SV 973'];
const FREQUENCIES = [20, 25, 31.5, 40, 50, 63, 80, 100, 125, 160, 200, 250, 315, 400, 500, 630, 800, 1000, 1250, 1600, 2000, 2500, 3150, 4000, 5000, 6300, 8000, 10000];
const EXPECTED_DATA_BYTES = 62;

/**
 * Svantek dosimeter device manager. Uses raw BLE via BleClient (same pattern as TympanManager).
 * Does not use the tabsintcha plugin — the Svantek protocol is entirely different from CHA devices.
 */
export class SvantekManager implements IDeviceManager {
  private readonly logger = inject(Logger);
  private readonly zone = inject(NgZone);
  private readonly notifications = inject(Notifications);
  private readonly transloco = inject(TranslocoService);
  private readonly tasks = inject(Tasks);

  private scanning = false;
  private readonly SCAN_TIMEOUT = 5000;
  private readonly requestedDisconnectionIds: Set<string> = new Set<string>();

  private readonly devicesSubject = new BehaviorSubject<SvantekDevice[]>([]);
  readonly devices: Observable<SvantekDevice[]> = this.devicesSubject.pipe(map(devices => structuredClone(devices)));

  // Per-device state for BLE notification message accumulation, polling intervals, and latest results
  private readonly msgBuffers = new Map<string, Int8Array>();
  private readonly pollingIntervals = new Map<string, number>();
  private readonly latestResults = new Map<string, SvantekResultInterface>();

  /**
   * Update a device in the subject list, replacing the existing entry by deviceId.
   */
  updateDevice = (device: SvantekDevice): void => {
    const devices = this.devicesSubject.getValue();
    const idx = devices.findIndex(dev => dev.deviceId === device.deviceId);
    if (idx !== -1) {
      devices.splice(idx, 1, device);
      this.devicesSubject.next(devices);
    }
  };

  /**
   * Called by BleClient on unexpected disconnection.
   */
  onDisconnectCallback = (deviceId: string): void => {
    this.zone.run(() => {
      const devices = structuredClone(this.devicesSubject.getValue());
      const updated = devices.map(d => (d.deviceId === deviceId ? { ...d, state: DeviceState.Disconnected } : d));
      this.devicesSubject.next(updated);
      if (!this.requestedDisconnectionIds.has(deviceId)) {
        this.notifications.alert({
          title: 'Alert',
          content: this.transloco.translate("The Svantek device's connection has timed out."),
          type: DialogType.Alert,
        });
      }
      this.requestedDisconnectionIds.delete(deviceId);
    });
    this.logger.debug(`Svantek device ${deviceId} disconnected`);
  };

  createDevice(savedDevice: SavedDevice): SvantekDevice {
    return new SvantekDevice(savedDevice.deviceId, savedDevice.name, savedDevice.tabsintId);
  }

  addDevice(device: SvantekDevice): void {
    const devices = structuredClone(this.devicesSubject.getValue());
    if (!devices.some(dev => dev.deviceId === device.deviceId)) {
      devices.push(device);
      this.devicesSubject.next(devices);
    }
  }

  removeDevice(device: SvantekDevice): void {
    const devices = structuredClone(this.devicesSubject.getValue()).filter(dev => dev.deviceId !== device.deviceId);
    this.devicesSubject.next(devices);
  }

  setTabsintId(device: IDevice, id: string): void {
    const devices = structuredClone(this.devicesSubject.getValue());
    const updated = devices.map(dev => (dev.deviceId === device.deviceId ? { ...dev, tabsintId: id } : dev));
    this.devicesSubject.next(updated);
  }

  async startDeviceSearch(): Promise<void> {
    if (this.scanning) {
      return;
    }
    try {
      this.scanning = true;
      const seen = new Set<string>();
      const scan = async () => {
        await BleClient.requestLEScan({}, (result: ScanResult) => {
          const name = result.device.name ?? '';
          const isKnown = DEVICE_NAME_FILTERS.some(f => name.includes(f)) && !name.endsWith('*');
          if (!isKnown || seen.has(result.device.deviceId)) {
            return;
          }
          seen.add(result.device.deviceId);
          const svantekDevice = new SvantekDevice(result.device.deviceId, name);
          svantekDevice.state = DeviceState.Discovery;
          const devices = this.devicesSubject.getValue();
          if (!devices.some(dev => dev.deviceId === result.device.deviceId)) {
            devices.push(svantekDevice);
            this.devicesSubject.next(devices);
          }
        });
        setTimeout(async () => {
          await BleClient.stopLEScan();
          if (this.scanning) {
            await scan();
          }
        }, this.SCAN_TIMEOUT);
      };
      await scan();
    } catch (error) {
      this.scanning = false;
      throw new Error('Error starting Svantek BLE scan: ' + JSON.stringify(error));
    }
  }

  async stopDeviceSearch(): Promise<void> {
    await BleClient.stopLEScan();
    this.scanning = false;
    const devices = this.devicesSubject.getValue().filter(d => d.state !== DeviceState.Discovery);
    this.devicesSubject.next(devices);
  }

  /**
   * Connect to a Svantek device. Follows the three-step handshake from the Svantek protocol:
   * 1. Write 0x01 to start characteristic
   * 2. Write PIN bytes to pin characteristic
   * 3. Write measurement control string to set 1/3 octave mode with Z-filter
   */
  async connect(device: IDevice): Promise<void> {
    try {
      this.tasks.register('Connect Device', 'Connecting to Svantek...');
      await BleClient.connect(device.deviceId, deviceId => this.onDisconnectCallback(deviceId));
      await this.writeBytes(device.deviceId, CHAR_START_UUID, new Int8Array([1]));
      await this.writeBytes(device.deviceId, CHAR_PIN_UUID, new Int8Array([1, 2, 3, 4]));
      await this.writeAscii(device.deviceId, CHAR_EXCHANGE_UUID, '#1,M3,f1;');
      this.tasks.deregister('Connect Device');
      const devices = this.devicesSubject.getValue();
      const liveDevice = devices.find(dev => dev.deviceId === device.deviceId);
      if (liveDevice) {
        liveDevice.state = DeviceState.Connected;
        this.devicesSubject.next(devices);
      }
    } catch (err) {
      this.tasks.deregister('Connect Device');
      const devices = this.devicesSubject.getValue();
      const liveDevice = devices.find(dev => dev.deviceId === device.deviceId);
      if (liveDevice) {
        liveDevice.state = DeviceState.Disconnected;
        this.devicesSubject.next(devices);
      }
      throw err;
    }
  }

  async disconnect(device: IDevice): Promise<void> {
    this.requestedDisconnectionIds.add(device.deviceId);
    try {
      await BleClient.disconnect(device.deviceId);
    } finally {
      this.logger.debug(`Disconnected from Svantek: ${device.deviceId}`);
    }
    const devices = this.devicesSubject.getValue();
    const liveDevice = devices.find(dev => dev.deviceId === device.deviceId);
    if (liveDevice) {
      liveDevice.state = DeviceState.Disconnected;
      this.devicesSubject.next(devices);
    }
  }

  /**
   * Start recording from the Svantek. Sends the start measurement command, subscribes to BLE
   * notifications on the exchange characteristic, and begins polling for measurement data every 500ms.
   * @param device The Svantek device to start recording on.
   */
  async startRecording(device: IDevice): Promise<void> {
    try {
      await this.writeAscii(device.deviceId, CHAR_EXCHANGE_UUID, '#1,S1;');
    } catch (e: any) {
      if (e?.message?.includes('Write failed') || e?.msg === '"Write failed"') {
        await new Promise(resolve => setTimeout(resolve, 200));
        await this.writeAscii(device.deviceId, CHAR_EXCHANGE_UUID, '#1,S1;');
      } else {
        throw e;
      }
    }
    this.msgBuffers.delete(device.deviceId);
    this.latestResults.delete(device.deviceId);

    await BleClient.startNotifications(device.deviceId, SERVICE_UUID, CHAR_EXCHANGE_UUID, (dataView: DataView) => {
      this.accumulatePacket(device.deviceId, dataView);
    });

    const interval = window.setInterval(async () => {
      this.interpretMessage(device.deviceId);
      await this.writeAscii(device.deviceId, CHAR_EXCHANGE_UUID, '#3;');
    }, 500);
    this.pollingIntervals.set(device.deviceId, interval);
  }

  /**
   * Stop recording from the Svantek. Clears the polling interval and unsubscribes from notifications.
   * @param device The Svantek device to stop recording on.
   */
  async stopRecording(device: IDevice): Promise<void> {
    const interval = this.pollingIntervals.get(device.deviceId);
    if (interval !== undefined) {
      clearInterval(interval);
      this.pollingIntervals.delete(device.deviceId);
    }
    await this.writeAscii(device.deviceId, CHAR_EXCHANGE_UUID, '#1,S0;');
    await BleClient.stopNotifications(device.deviceId, SERVICE_UUID, CHAR_EXCHANGE_UUID);
  }

  /**
   * Return the latest measurement result for a Svantek device, captured during the most recent
   * recording session. Returns undefined if no measurement has been received yet.
   * @param device The Svantek device to retrieve the result for.
   */
  getSvantekResult(device: IDevice): SvantekResultInterface | undefined {
    return this.latestResults.get(device.deviceId);
  }

  /**
   * Accumulate an incoming 20-byte BLE notification packet into the per-device message buffer.
   */
  private accumulatePacket(deviceId: string, dataView: DataView): void {
    const incoming = new Int8Array(dataView.buffer);
    const existing = this.msgBuffers.get(deviceId);
    if (existing) {
      const merged = new Int8Array(existing.length + incoming.length);
      merged.set(existing);
      merged.set(incoming, existing.length);
      this.msgBuffers.set(deviceId, merged);
    } else {
      this.msgBuffers.set(deviceId, incoming);
    }
  }

  /**
   * Parse the accumulated buffer for a device and update its metadata with 1/3 octave band levels.
   * Buffer layout (from Svantek protocol): status byte at index 3, data begins at index 6.
   * Data section is 31 × little-endian int16 values ÷ 100, ordered as:
   *   indices 0-27: 1/3 octave band Leq values
   *   index 28: LeqA, index 29: LeqC, index 30: LeqZ
   */
  private interpretMessage(deviceId: string): void {
    const msgBuff = this.msgBuffers.get(deviceId);
    if (!msgBuff) {
      return;
    }

    const statusByte = msgBuff[3];
    const dataArray = msgBuff.slice(6);

    if (dataArray.length !== EXPECTED_DATA_BYTES) {
      this.logger.warning(`Svantek ${deviceId}: unexpected data length ${dataArray.length}, expected ${EXPECTED_DATA_BYTES}`);
    } else {
      const Leq: number[] = [];
      for (let i = 0; i < dataArray.length - 1; i += 2) {
        Leq.push(this.asI16(dataArray.slice(i, i + 2)) / 100);
      }

      const result: SvantekResultInterface = {
        time: new Date().toJSON(),
        status: statusByte,
        Leq: Leq.slice(0, 28),
        Frequencies: FREQUENCIES,
        LeqA: Leq[28],
        LeqC: Leq[29],
        LeqZ: Leq[30],
        overallAmbientNoise: Leq[28],
      };
      this.latestResults.set(deviceId, result);
    }

    this.msgBuffers.delete(deviceId);
  }

  /**
   * Decode a 2-byte little-endian signed int16 value (no byte swapping).
   */
  private asI16(data: Int8Array): number {
    if (data.length !== 2) {
      return 0;
    }
    let sample = (data[1] & 0xff) << 8;
    sample |= data[0] & 0xff;
    if ((sample & 0x8000) > 0) {
      sample = sample - 0x10000;
    }
    return sample;
  }

  private async writeBytes(deviceId: string, characteristicUUID: string, data: Int8Array): Promise<void> {
    await BleClient.write(deviceId, SERVICE_UUID, characteristicUUID, new DataView(data.buffer));
  }

  private async writeAscii(deviceId: string, characteristicUUID: string, text: string): Promise<void> {
    const encoded = new TextEncoder().encode(text);
    await BleClient.write(deviceId, SERVICE_UUID, characteristicUUID, new DataView(encoded.buffer));
  }
}

/**
 * Calculate the 1/3 octave band level centered at a given frequency.
 * Sums the center band and its two neighbors in energy (power sum), matching the Svantek protocol.
 * Returns undefined if the frequency is not found or is at the edge of the measured range.
 * @param result Svantek measurement result containing Leq and Frequencies arrays.
 * @param frequency The octave-band center frequency to calculate for.
 */
export function calculateSvantekBandLevel(result: SvantekResultInterface, frequency: number): number | undefined {
  const idx = result.Frequencies.indexOf(frequency);
  if (idx > 0 && idx < result.Leq.length - 1) {
    const Llower = result.Leq[idx - 1];
    const Lcenter = result.Leq[idx];
    const Lupper = result.Leq[idx + 1];
    return 10 * Math.log10(Math.pow(10, Llower / 10) + Math.pow(10, Lcenter / 10) + Math.pow(10, Lupper / 10));
  }
  return undefined;
}

/**
 * Type guard for ISvantekDevice.
 */
export function isSvantekDevice(device: IDevice): device is ISvantekDevice {
  return device.type === 'Svantek';
}
