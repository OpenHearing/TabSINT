import { Component, Input, OnDestroy, OnInit, inject } from '@angular/core';
import { Subscription } from 'rxjs';
import { BluetoothType, DeviceState, DeviceType } from '../../../../utilities/constants';
import { IDevice } from '../../../../interfaces/devices/device.interface';
import { IWahtsDevice } from '../../../../interfaces/devices/wahts-device.interface';
import { FirmwareAsset } from '../../../../interfaces/firmware-asset.interface';
import { DiskInterface } from '../../../../models/disk/disk.interface';
import { DiskModel } from '../../../../models/disk/disk.service';
import { DevicesService } from '../../../../services/devices/devices.service';
import { Logger } from '../../../../services/logger.service';

@Component({
  selector: 'app-device-card',
  templateUrl: './device-card.component.html',
})
export class DeviceCardComponent implements OnInit, OnDestroy {
  @Input() device!: IDevice;
  @Input() bluetoothConnected = false;

  private readonly devicesService = inject(DevicesService);
  private readonly diskModel = inject(DiskModel);
  private readonly logger = inject(Logger);

  BluetoothType = BluetoothType;
  DeviceState = DeviceState;
  DeviceType = DeviceType;
  settingsExpanded = false;
  advancedExpanded = false;
  disk: DiskInterface;
  wahtsFirmwareAsset!: Promise<FirmwareAsset | undefined>;

  private diskSubscription: Subscription | undefined;

  constructor() {
    this.disk = this.diskModel.getDisk();
  }

  get wahtsDevice(): IWahtsDevice | undefined {
    return this.device.type === DeviceType.Wahts ? (this.device as IWahtsDevice) : undefined;
  }

  ngOnInit(): void {
    this.diskSubscription = this.diskModel.diskSubject.subscribe(updated => {
      this.disk = updated;
    });
    if (this.device.type === DeviceType.Wahts) {
      this.wahtsFirmwareAsset = this.devicesService.getApplicationFirmware(DeviceType.Wahts);
    }
  }

  ngOnDestroy(): void {
    this.diskSubscription?.unsubscribe();
  }

  async reconnect(): Promise<void> {
    this.logger.debug('reconnecting to device: ' + this.device.deviceId);
    await this.devicesService.connect(this.device);
    await this.devicesService.checkForFirmwareUpdate(this.device);
  }

  async disconnect(): Promise<void> {
    this.logger.debug('disconnecting from device: ' + this.device.deviceId);
    await this.devicesService.disconnect(this.device);
  }

  async remove(): Promise<void> {
    this.logger.debug('removing device: ' + this.device.deviceId);
    if (this.device.state !== DeviceState.Disconnected) {
      await this.devicesService.disconnect(this.device);
    }
    await this.devicesService.removeSavedDevice(this.device);
  }

  toggleSettings(): void {
    this.settingsExpanded = !this.settingsExpanded;
  }

  toggleAdvancedSettings(): void {
    this.advancedExpanded = !this.advancedExpanded;
  }

  toggleIgnoreFirmwareUpdates(): void {
    this.diskModel.updatePreferences({ ignoreFirmwareUpdates: !this.disk.preferences.ignoreFirmwareUpdates });
  }

  toggleDisableAudioStreaming(): void {
    this.diskModel.updatePreferences({ disableAudioStreaming: !this.disk.preferences.disableAudioStreaming });
  }

  toggleEnableHeadsetMediaManagement(): void {
    this.diskModel.updatePreferences({ enableHeadsetMediaManagement: !this.disk.preferences.enableHeadsetMediaManagement });
  }

  async changeWahtsConnectionType(connectionType: BluetoothType): Promise<void> {
    await this.devicesService.changeWahtsConnectionType(connectionType);
  }

  reprogramFirmware(): void {
    this.devicesService.reprogramFirmwareDialog(this.device);
  }

  editAutoShutdownTime(): void {
    console.log('Edit Auto Shutdown Time pressed');
  }

  fitTonesLeft(): void { console.log('Fit Tones Left pressed'); }
  fitTonesRight(): void { console.log('Fit Tones Right pressed'); }
  fitTonesStop(): void { console.log('Fit Tones Stop pressed'); }
  audioStreamingOn(): void { console.log('Audio Streaming On pressed'); }
  audioStreamingPhrase(): void { console.log('Audio Streaming Phrase pressed'); }
  audioStreamingCompAudio(): void { console.log('Audio Streaming CompAudio pressed'); }
  audioStreamingStop(): void { console.log('Audio Streaming Stop pressed'); }
  testSounds(): void { console.log('Test Sounds pressed'); }
}
