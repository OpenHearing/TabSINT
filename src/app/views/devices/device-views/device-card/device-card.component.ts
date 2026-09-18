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
  @Input() device!: IDevice;
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
  transitionLabel: string | undefined;

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
    if (this.isTransitioning) {
      return;
    }
    this.transitionLabel = 'Connecting...';
    this.logger.debug('reconnecting to device: ' + this.device.deviceId);
    try {
      await this.devicesService.connect(this.device);
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
    } finally {
      this.transitionLabel = undefined;
    }
    await this.devicesService.checkForFirmwareUpdate(this.device);
  }

  async disconnect(): Promise<void> {
    if (this.isTransitioning) {
      return;
    }
    this.transitionLabel = 'Disconnecting...';
    this.logger.debug('disconnecting from device: ' + this.device.deviceId);
    try {
      await this.devicesService.disconnect(this.device);
    } finally {
      this.transitionLabel = undefined;
    }
  }

  async remove(): Promise<void> {
    if (this.isTransitioning) {
      return;
    }
    this.transitionLabel = 'Removing...';
    this.logger.debug('removing device: ' + this.device.deviceId);
    try {
      if (this.device.state !== DeviceState.Disconnected) {
        await this.devicesService.disconnect(this.device);
      }
      await this.devicesService.removeSavedDevice(this.device);
    } finally {
      this.transitionLabel = undefined;
    }
  }

  toggleSettings(): void {
    this.settingsExpanded = !this.settingsExpanded;
  }

  get isTransitioning(): boolean {
    return this.transitionLabel !== undefined;
  }

  get stateLabel(): string {
    if (this.transitionLabel) {
      return this.transitionLabel;
    }
    switch (this.device.state) {
      case DeviceState.Connected:
        return 'Connected';
      case DeviceState.Disconnected:
        return 'Not Connected';
      default:
        return '';
    }
  }

  get connectDisabled(): boolean {
    return !this.enabled || !this.connected || this.isTransitioning;
  }
}
