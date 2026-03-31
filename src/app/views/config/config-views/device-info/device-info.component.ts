import { Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';

import { DiskInterface } from '../../../../models/disk/disk.interface';
import { StateInterface } from '../../../../models/state/state.interface';

import { DiskModel } from '../../../../models/disk/disk.service';
import { StateModel } from '../../../../models/state/state.service';

import { AppState, DeviceState, DeviceStatus, DialogType } from '../../../../utilities/constants';
import { IDevice } from '../../../../interfaces/devices/device.interface';
import { ChangeTabsintIdComponent } from '../../../change-tabsint-id/change-tabsint-id.component';
import { MatDialog } from '@angular/material/dialog';
import { DialogDataInterface } from '../../../../interfaces/dialog-data.interface';
import { DevicesService } from '../../../../services/devices/devices.service';
import { Notifications } from '../../../../services/notifications.service';
import { isValidDeviceResponse } from '../../../../guards/type.guard';

@Component({
  selector: 'device-info-view',
  templateUrl: './device-info.component.html',
  styleUrl: './device-info.component.css',
})
export class DeviceInfoComponent implements OnInit, OnDestroy, OnChanges {
  @Input() device!: IDevice;
  disk: DiskInterface;
  state: StateInterface;
  firmwareMatch: boolean | undefined = undefined;

  diskSubscription: Subscription | undefined;
  stateSubscription: Subscription | undefined;
  devicesSubscription: Subscription | undefined;

  constructor(
    private readonly diskModel: DiskModel,
    private readonly stateModel: StateModel,
    private readonly translate: TranslateService,
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

  reprogramFirmware(device: IDevice) {
    const msg: DialogDataInterface = {
      title: 'Confirm Firmware Update',
      content: 'Are you sure you want to update the firmware?',
      type: DialogType.Confirm,
    };
    this.notifications.alert(msg).subscribe(async (result: string) => {
      if (result === 'OK') {
        let completionResponse = 'The device is unavailable to reprogram.';
        if (device.state === DeviceState.Connected && device.status !== DeviceStatus.Busy) {
          const response = await this.devicesService.reprogramFirmware(device);
          if (isValidDeviceResponse(response)) {
            await this.devicesService.reboot(device);
            completionResponse = 'The device will now reboot. Reconnect the device to verify firmware was updated.';
          }
        }
        this.notifications.alert({
          title: 'Alert',
          content: this.translate.instant(completionResponse),
          type: DialogType.Alert,
        });
      }
    });
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

  setShutdownTimerPopover = this.translate.instant('Auto shutdown time (in minutes) for the WAHTS headset.');

  setTabsintIdPopover = this.translate.instant('Set the unique TabSINT ID for the device.');

  firmwarePopover = this.translate.instant(
    'The firmware currently running on the device. If the firmware is listed in red, the firmware on the device is not supported by this version of TabSINT and should be updated.'
  );
}
