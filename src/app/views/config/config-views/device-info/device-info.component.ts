import { Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import { Subscription } from 'rxjs';

import { DiskInterface } from '../../../../models/disk/disk.interface';
import { StateInterface } from '../../../../models/state/state.interface';

import { DiskModel } from '../../../../models/disk/disk.service';
import { StateModel } from '../../../../models/state/state.service';

import { AppState, DeviceState } from '../../../../utilities/constants';
import { IDevice } from '../../../../interfaces/devices/device.interface';
import { ChangeTabsintIdComponent } from '../../../change-tabsint-id/change-tabsint-id.component';
import { MatDialog } from '@angular/material/dialog';
import { DevicesService } from '../../../../services/devices/devices.service';
import { Notifications } from '../../../../services/notifications.service';

@Component({
  selector: 'device-info-view',
  templateUrl: './device-info.component.html',
  styleUrl: './device-info.component.css',
})
export class DeviceInfoComponent implements OnInit, OnDestroy, OnChanges {
  @Input() device!: IDevice;
  DeviceState = DeviceState;
  disk: DiskInterface;
  state: StateInterface;
  firmwareMatch: boolean | undefined = undefined;

  diskSubscription: Subscription | undefined;
  stateSubscription: Subscription | undefined;
  devicesSubscription: Subscription | undefined;

  constructor(
    private readonly diskModel: DiskModel,
    private readonly stateModel: StateModel,
    private readonly transloco: TranslocoService,
    private readonly dialog: MatDialog,
    private readonly devicesService: DevicesService,
    private readonly notifications: Notifications
  ) {
    this.disk = this.diskModel.getDisk();
    this.state = this.stateModel.getState();
  }

  ngOnInit(): void {
    this.diskSubscription = this.diskModel.diskSubject.subscribe((updatedDisk: DiskInterface) => {
      this.disk = updatedDisk;
    });
    this.stateSubscription = this.stateModel.stateSubject.subscribe(updatedState => {
      this.state = updatedState;
    });
    this.stateModel.updateState({ appState: AppState.Admin });
  }

  ngOnDestroy(): void {
    this.diskSubscription?.unsubscribe();
    this.stateSubscription?.unsubscribe();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['device']) {
      this.updateFirmwareMatch();
    }
  }

  editTabsintId(device: IDevice): void {
    this.dialog.open(ChangeTabsintIdComponent, { data: device });
  }

  /**
   * Open the dialog for reprogramming a device.
   * @param device The device to reprogram.
   */
  reprogramFirmware(device: IDevice) {
    this.devicesService.reprogramFirmwareDialog(device);
  }

  /**
   * Determine if the firmware matches the applications built in firmware based on the datetime.
   * If a datetime is missing set the firmwareMatch value to undefined.
   */
  async updateFirmwareMatch() {
    const firmwareAsset = await this.devicesService.getApplicationFirmware(this.device.type);
    if (!this.device.metadata.buildDateTime || !firmwareAsset?.buildDatetime) {
      this.firmwareMatch = undefined;
    } else {
      this.firmwareMatch = Date.parse(this.device.metadata.buildDateTime) === Date.parse(firmwareAsset.buildDatetime);
    }
  }

  get setShutdownTimerPopover() { return this.transloco.translate('Auto shutdown time (in minutes) for the WAHTS headset.'); }
  get setTabsintIdPopover() { return this.transloco.translate('Set the unique TabSINT ID for the device.'); }
  get firmwarePopover() {
    return this.transloco.translate(
      'The firmware currently running on the device. If the firmware is listed in red, the firmware on the device is not supported by this version of TabSINT and should be updated.'
    );
  }
}
