import { Directory, Filesystem } from '@capacitor/filesystem';
import { Buffer } from 'buffer';
import { firstValueFrom } from 'rxjs';
import { WahtsDevice } from '../../models/devices/wahts-device';
import { SavedDevice } from '../../models/disk/disk.interface';
import { ChaManager } from './cha-manager';
import { DeviceState } from '../../utilities/constants';
import { DiscoveryResponse, TabsintCha } from 'tabsintcha';
import { FirmwareAsset } from '../../interfaces/firmware-asset.interface';
import { IDeviceResponse } from '../../interfaces/devices/device-response.interface';

/**
 * WAHTS implementation of the CHA device manager.
 */
export class WahtsManager extends ChaManager {
  /**
   * Information related to the application held firmware.
   */
  private firmwareAsset: FirmwareAsset | undefined = undefined;

  /**
   * Binary firmware file name.
   */
  private readonly BINARY_FIRMWARE_FILENAME = 'CHA_firmware.dat';

  /**
   * Assets path to the binary firmware file.
   */
  private readonly BINARY_FIRMWARE_PATH = `assets/firmware/${this.BINARY_FIRMWARE_FILENAME}`;

  /**
   * Assets path to the metadata firmware file.
   */
  private readonly METADATA_FIRMWARE_PATH = 'assets/firmware/CHA_firmware.json';

  /**
   * Create a new device from a saved device.
   * @param savedDevice The saved device to create a device for.
   * @returns The created device.
   */
  override createDevice(savedDevice: SavedDevice): WahtsDevice {
    const device = new WahtsDevice(savedDevice.deviceId, savedDevice.name, savedDevice.tabsintId);
    device.connectionType = (savedDevice as WahtsDevice).connectionType;
    return device;
  }

  /**
   * Start a device search to retrieve available devices for the specified device type.
   * The search is limited to the user-specified connection type (BluetoothType).
   * @param deviceType The type of device the search should be started for.
   */
  override async startDeviceSearch(): Promise<void> {
    if (this.scanning) {
      return;
    }
    try {
      this.scanning = true;
      const connectionType = (await firstValueFrom(this.diskModel.diskSubject)).preferences.wahtsConnectionType;
      const connectionTypeKey = this.getConnectionKey(connectionType);
      this.discoveryListener = (response: DiscoveryResponse) => {
        const newDevice = new WahtsDevice(response.name, response.name);
        newDevice.connectionType = connectionType;
        newDevice.state = DeviceState.Discovery;
        if (!newDevice.name.includes('DOS')) {
          this.addDevice(newDevice);
        }
      };
      TabsintCha.addListener('TabsintChaDiscovery', response => this.discoveryListener?.(response));
      await TabsintCha.startChaSearch({ infStr: connectionTypeKey });
    } catch (error) {
      this.scanning = false;
      throw new Error('Error starting BLE scan: ' + JSON.stringify(error));
    }
  }

  /**
   * Reprogram a device.
   * @param device The device to reprogram.
   * @returns The device response for the reprogram request.
   */
  async reprogramFirmware(device: WahtsDevice): Promise<IDeviceResponse> {
    const firmwareTask = 'Transfer Firmware';
    this.tasks.register(firmwareTask, 'Transferring Firmware to the Device...');
    const firmwareErrorResponse = { deviceId: device.deviceId, msg: ['Error', 'Failed to create firmware asset'] };
    try {
      if (!this.firmwareAsset) {
        this.firmwareAsset = await this.loadFirmwareAsset();
        if (!this.firmwareAsset) {
          this.tasks.deregister(firmwareTask);
          await this.deviceErrorHandler(firmwareErrorResponse);
          return firmwareErrorResponse;
        }
      }
      const response = await this.adapter.reprogramFirmware(device, this.firmwareAsset);
      this.tasks.deregister(firmwareTask);
      await this.deviceErrorHandler(response);
      return response;
    } catch (error) {
      this.logger.error('Error while reprogramming firmware: ' + error);
      this.tasks.deregister(firmwareTask);
      await this.deviceErrorHandler(firmwareErrorResponse);
      return firmwareErrorResponse;
    }
  }

  /**
   * Get firmware information for the available application firmware.
   * @returns The firmware asset provided by the application for the managed device type or undefined.
   */
  async getApplicationFirmware(): Promise<FirmwareAsset | undefined> {
    this.firmwareAsset ??= await this.loadFirmwareAsset();
    return this.firmwareAsset;
  }

  /**
   * Load a firmware asset and create the firmware file in an accessible location for the CHA plugin.
   * @returns The created firmware asset or undefined.
   */
  private async loadFirmwareAsset(): Promise<FirmwareAsset | undefined> {
    const firmwareResponse = await fetch(this.BINARY_FIRMWARE_PATH);
    const metadataResponse = await fetch(this.METADATA_FIRMWARE_PATH);

    if (!firmwareResponse.ok || !metadataResponse.ok) {
      this.logger.error('Failed to read firmware files');
      return undefined;
    }

    const buffer = await firmwareResponse.arrayBuffer();
    const metadataJSON = await metadataResponse.json();

    const base64Data = Buffer.from(buffer).toString('base64');
    const checksum = this.calculateCRC32(new Uint8Array(buffer));

    const writeResponse = await Filesystem.writeFile({
      path: this.BINARY_FIRMWARE_FILENAME,
      data: base64Data,
      directory: Directory.Data,
    });

    if (!writeResponse.uri || !metadataJSON.tag || !metadataJSON.time) {
      this.logger.error('Failed to generate the firmware asset');
      return undefined;
    }
    // Make the path accessible via Java
    const updatedFilePath = writeResponse.uri.replace('file://', '');

    return {
      fileName: this.BINARY_FIRMWARE_FILENAME,
      filePath: updatedFilePath,
      version: String(metadataJSON.tag),
      buildDatetime: String(metadataJSON.time),
      checksum: checksum,
    };
  }

  /**
   * Calculate a CRC32 checksum for a byte array.
   * @param byteArray The byte array for checksum calculation.
   * @returns The CRC32 checksum.
   */
  private calculateCRC32(byteArray: Uint8Array): number {
    const crcTable = new Uint32Array(256);
    for (let index = 0; index <= 255; index++) {
      let tableValue = index;
      for (let k = 0; k <= 7; k++) {
        const leastSignificantBit = tableValue & 1;
        if (leastSignificantBit === 1) {
          const reversedGeneratorPolynomial = 0xedb88320;
          tableValue = reversedGeneratorPolynomial ^ (tableValue >>> 1);
        } else {
          tableValue = tableValue >>> 1;
        }
      }
      crcTable[index] = tableValue >>> 0;
    }
    const maxInt32 = 0xffffffff;
    let crcValue = maxInt32;
    for (const byte of byteArray) {
      const crcTableIndex = (crcValue ^ byte) & 255;
      crcValue = crcTable[crcTableIndex] ^ (crcValue >>> 8);
    }
    crcValue = (crcValue ^ maxInt32) >>> 0;
    return crcValue;
  }
}
