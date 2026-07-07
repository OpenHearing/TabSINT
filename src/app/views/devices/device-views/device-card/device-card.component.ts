import { Component, Input, OnDestroy, OnInit, inject } from '@angular/core';
import { Subscription } from 'rxjs';
import { BluetoothType, DeviceState, DeviceType } from '../../../../utilities/constants';
import { IDevice } from '../../../../interfaces/devices/device.interface';
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
  @Input() connected = false;
  @Input() enabled = true;

  private readonly devicesService = inject(DevicesService);
  private readonly diskModel = inject(DiskModel);
  private readonly logger = inject(Logger);

  BluetoothType = BluetoothType;
  DeviceState = DeviceState;
  DeviceType = DeviceType;
  settingsExpanded = false;
  disk: DiskInterface;

  private diskSubscription: Subscription | undefined;

  constructor() {
    this.disk = this.diskModel.getDisk();
  }

  ngOnInit(): void {
    this.diskSubscription = this.diskModel.diskSubject.subscribe(updated => {
      this.disk = updated;
    });
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
}
