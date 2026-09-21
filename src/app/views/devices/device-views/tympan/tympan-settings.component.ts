import { Component, Input, OnDestroy, OnInit, inject } from '@angular/core';
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
import { ITympanDevice } from '../../../../interfaces/devices/tympan-device.interface';
import { AppColor } from '../../../../utilities/color';

@Component({
  selector: 'app-tympan-settings',
  templateUrl: './tympan-settings.component.html',
})
export class TympanSettingsComponent implements OnInit, OnDestroy {
  private readonly diskModel = inject(DiskModel);
  private readonly stateModel = inject(StateModel);
  private readonly transloco = inject(TranslocoService);
  private readonly dialog = inject(MatDialog);
  private readonly devicesService = inject(DevicesService);
  readonly ColorPalette = AppColor;

  @Input() deviceId!: string;
  DeviceState = DeviceState;
  disk: DiskInterface;
  state: StateInterface;
  firmwareMatch: boolean | undefined = undefined;
  device!: ITympanDevice;

  diskSubscription: Subscription | undefined;
  stateSubscription: Subscription | undefined;
  deviceSubscription: Subscription | undefined;

  constructor() {
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
    this.deviceSubscription = this.devicesService.getDeviceById$(this.deviceId).subscribe(device => {
      if (device) {
        this.device = device as ITympanDevice;
        this.updateFirmwareMatch();
      }
    });
  }

  ngOnDestroy(): void {
    this.diskSubscription?.unsubscribe();
    this.stateSubscription?.unsubscribe();
    this.deviceSubscription?.unsubscribe();
  }

  editTabsintId(device: IDevice): void {
    this.dialog.open(ChangeTabsintIdComponent, { data: device.deviceId });
  }

  /**
   * Open the dialog for reprogramming a device.
   * @param device The device to reprogram.
   */
  reprogramFirmware(device: IDevice) {
    this.devicesService.reprogramFirmwareDialog(device.deviceId);
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

  get setTabsintIdPopover() {
    return this.transloco.translate('Set the unique TabSINT ID for the device.');
  }
  get firmwarePopover() {
    return this.transloco.translate('Update Firmware Help');
  }
}
