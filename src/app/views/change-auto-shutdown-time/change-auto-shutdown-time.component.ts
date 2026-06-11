import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { TranslocoPipe } from '@jsverse/transloco';
import { CommonModule } from '@angular/common';
import { DevicesService } from '../../services/devices/devices.service';
import { ChaDeviceType } from '../../utilities/constants';
import { isRequestSettingResponse } from '../../guards/type.guard';

@Component({
  selector: 'app-change-auto-shutdown-time',
  standalone: true,
  templateUrl: './change-auto-shutdown-time.component.html',
  imports: [CommonModule, FormsModule, TranslocoPipe],
})
export class ChangeAutoShutdownTimeComponent {
  private readonly dialog = inject(MatDialog);
  private readonly devicesService = inject(DevicesService);
  readonly device = inject<ChaDeviceType>(MAT_DIALOG_DATA);

  shutdownTime: number | undefined;

  async save() {
    const shutdownTime = this.shutdownTime ?? 0;
    if (!Number.isInteger(this.shutdownTime) || shutdownTime < 5 || shutdownTime > 60) {
      alert('Please enter a valid positive integer between 5 and 60 for the shutdown time.');
      return;
    }
    await this.devicesService.writeSetting(this.device, 'auto_shutdown_time', shutdownTime);
    const requestSettingResp = await this.devicesService.requestSetting(this.device, 'auto_shutdown_time');
    if (!isRequestSettingResponse(requestSettingResp)) {
      await this.devicesService.disconnect(this.device);
      throw new Error('Connection failed.');
    }
    this.dialog.closeAll();
  }

  cancel() {
    this.dialog.closeAll();
  }
}
