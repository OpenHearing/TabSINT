import { Component, Input, OnDestroy, OnInit, inject } from '@angular/core';
import { Subscription } from 'rxjs';
import { BluetoothType, DeviceState, DeviceType, DialogType } from '../../../../utilities/constants';
import { IDevice } from '../../../../interfaces/devices/device.interface';
import { DiskInterface } from '../../../../models/disk/disk.interface';
import { DiskModel } from '../../../../models/disk/disk.service';
import { DevicesService } from '../../../../services/devices/devices.service';
import { Logger } from '../../../../services/logger.service';
import { Notifications } from '../../../../services/notifications.service';

@Component({
  selector: 'app-device-card',
  templateUrl: './device-card.component.html',
})
export class DeviceCardComponent implements OnInit, OnDestroy {
  @Input() deviceId!: string;
  @Input() connected = false;
  @Input() enabled = true;

  private readonly devicesService = inject(DevicesService);
  private readonly diskModel = inject(DiskModel);
  private readonly logger = inject(Logger);
  private readonly notifications = inject(Notifications);

  BluetoothType = BluetoothType;
  DeviceState = DeviceState;
  DeviceType = DeviceType;
  settingsExpanded = false;
  disk: DiskInterface;
  device!: IDevice;

  private diskSubscription: Subscription | undefined;
  private deviceSubscription: Subscription | undefined;

  constructor() {
    this.disk = this.diskModel.getDisk();
  }

  ngOnInit(): void {
    this.diskSubscription = this.diskModel.diskSubject.subscribe(updated => {
      this.disk = updated;
    });
    this.deviceSubscription = this.devicesService.getDeviceById$(this.deviceId).subscribe(device => {
      if (device) {
        this.device = device;
      }
    });
  }

  ngOnDestroy(): void {
    this.diskSubscription?.unsubscribe();
    this.deviceSubscription?.unsubscribe();
  }

  async reconnect(): Promise<void> {
    this.logger.debug('reconnecting to device: ' + this.deviceId);
    try {
      await this.devicesService.connect(this.deviceId);
    } catch (err) {
      this.logger.debug('Device reconnection failed', err);
      this.notifications
        .alert({
          title: 'Connection Failed',
          content: `Failed to connect to ${this.device.tabsintId}.`,
          type: DialogType.Alert,
        })
        .subscribe();
      return;
    }
    await this.devicesService.checkForFirmwareUpdate(this.deviceId);
  }

  async disconnect(): Promise<void> {
    this.logger.debug('disconnecting from device: ' + this.deviceId);
    await this.devicesService.disconnect(this.deviceId);
  }

  async remove(): Promise<void> {
    this.logger.debug('removing device: ' + this.deviceId);
    if (this.device.state !== DeviceState.Disconnected) {
      await this.devicesService.disconnect(this.deviceId);
    }
    await this.devicesService.removeSavedDevice(this.deviceId);
  }

  toggleSettings(): void {
    this.settingsExpanded = !this.settingsExpanded;
  }
}
