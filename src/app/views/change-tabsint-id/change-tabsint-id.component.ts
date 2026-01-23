import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { Logger } from '../../services/logger.service';
import { CommonModule } from '@angular/common';
import { DevicesService } from '../../services/devices/devices.service';
import { firstValueFrom } from 'rxjs';
import { IDevice } from '../../interfaces/devices/device.interface';

@Component({
  selector: 'app-change-tabsint-id-view',
  standalone: true,
  templateUrl: './change-tabsint-id.component.html',
  imports: [CommonModule, FormsModule, TranslateModule],
})
export class ChangeTabsintIdComponent {
  /**
   * TabSINT identifier to be changed by the user.
   */
  tabsintId: string | undefined;

  constructor(
    private readonly logger: Logger,
    private readonly dialog: MatDialog,
    private readonly devicesService: DevicesService,
    @Inject(MAT_DIALOG_DATA) public device: IDevice
  ) {}

  /**
   * Save a new TabSINT identifier for the input device.
   * @param tabsintId The new identifier to be saved.
   */
  async save(tabsintId: string | undefined) {
    const devices = await firstValueFrom(this.devicesService.devices);
    const otherDevices = devices.filter(device => device.deviceId !== this.device.deviceId);
    if (tabsintId && !otherDevices.some(device => device.tabsintId === tabsintId)) {
      this.devicesService.setTabsintId(this.device, tabsintId);
      this.logger.debug('TabSINT ID set to: ' + tabsintId.toString());
    } else {
      alert('Invalid TabSINT ID. Ensure the ID is unique to the device and not empty.');
    }
    this.dialog.closeAll();
  }

  /**
   * Close the dialog without saving a new TabSINT identifier.
   */
  cancel() {
    this.dialog.closeAll();
  }
}
