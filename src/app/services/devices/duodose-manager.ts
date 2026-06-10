import { DuodoseDevice } from '../../models/devices/duodose-device';
import { SavedDevice } from '../../models/disk/disk.interface';
import { ChaManager } from './cha-manager';
import { BluetoothType, ChaDeviceType, DeviceState } from '../../utilities/constants';
import { DiscoveryResponse, TabsintCha } from 'tabsintcha';
import { StatusObject } from '../../interfaces/devices/device-responses.interface';

/**
 * DuoDose implementation of the CHA device manager.
 */
export class DuodoseManager extends ChaManager {
  /**
   * Create a new device from a saved device.
   * @param savedDevice The saved device to create a device for.
   * @returns The created device.
   */
  override createDevice(savedDevice: SavedDevice): DuodoseDevice {
    const device = new DuodoseDevice(savedDevice.deviceId, savedDevice.name, savedDevice.tabsintId);
    device.connectionType = (savedDevice as DuodoseDevice).connectionType;
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
      // Force Duodose to only support a single bluetooth connection type
      const connectionType = BluetoothType.BLUETOOTH_LE;
      const connectionTypeKey = this.getConnectionKey(connectionType);
      this.discoveryListener = (response: DiscoveryResponse) => {
        const newDevice = new DuodoseDevice(response.name, response.name);
        newDevice.connectionType = connectionType;
        newDevice.state = DeviceState.Discovery;
        if (newDevice.name.includes('DOS')) {
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
   * Update the battery level information for a device with request status information.
   * @param device The device to update.
   * @param statusResponse Request Status information.
   */
  override updateBatteryInformation(device: ChaDeviceType, statusResponse: StatusObject) {
    device.metadata.batteryLevel = Math.round(statusResponse.soc_pct);
    this.updateDevice(device);
  }
}
