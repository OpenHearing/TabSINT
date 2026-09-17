import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { TranslocoPipe } from '@jsverse/transloco';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { DevicesService } from '../../services/devices/devices.service';
import { ChaDeviceType } from '../../utilities/constants';
import { isRequestSettingResponse } from '../../guards/type.guard';

@Component({
  selector: 'app-change-auto-shutdown-time',
  standalone: true,
  templateUrl: './change-auto-shutdown-time.component.html',
  imports: [CommonModule, FormsModule, TranslocoPipe],
})
export class ChangeAutoShutdownTimeComponent implements OnInit, OnDestroy {
  private readonly dialog = inject(MatDialog);
  private readonly devicesService = inject(DevicesService);
  readonly deviceId = inject<string>(MAT_DIALOG_DATA);
  device: ChaDeviceType | undefined;

  shutdownTime: number | undefined;

  private deviceSubscription: Subscription | undefined;

  ngOnInit(): void {
    this.deviceSubscription = this.devicesService.getDeviceById$(this.deviceId).subscribe(device => {
      this.device = device as ChaDeviceType | undefined;
    });
  }

  ngOnDestroy(): void {
    this.deviceSubscription?.unsubscribe();
  }

  async save() {
    const shutdownTime = this.shutdownTime ?? 0;
    if (!Number.isInteger(this.shutdownTime) || shutdownTime < 5 || shutdownTime > 600) {
      alert('Please enter a valid positive integer between 5 and 600 for the shutdown time (minutes).');
      return;
    }
    await this.devicesService.writeSetting(this.deviceId, 'auto_shutdown_time', shutdownTime);
    const requestSettingResp = await this.devicesService.requestSetting(this.deviceId, 'auto_shutdown_time');
    if (!isRequestSettingResponse(requestSettingResp)) {
      await this.devicesService.disconnect(this.deviceId);
      throw new Error('Connection failed.');
    }
    this.dialog.closeAll();
  }

  cancel() {
    this.dialog.closeAll();
  }
}
