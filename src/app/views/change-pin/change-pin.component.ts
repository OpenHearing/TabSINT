import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

import { Logger } from '../../utilities/logger.service';
import { DiskInterface } from '../../models/disk/disk.interface';
import { DiskModel } from '../../models/disk/disk.service';

@Component({
  selector: 'change-pin-view',
  standalone: true,
  templateUrl: './change-pin.component.html',
  styleUrl: './change-pin.component.css',
  imports: [FormsModule, TranslateModule]
})
export class ChangePinComponent {
  disk: DiskInterface;
  pin: number | undefined;

  constructor(public logger: Logger, public dialog: MatDialog, public diskModel: DiskModel) {
    this.disk = this.diskModel.getDisk();
  }

  save(pin:number | undefined) {
    if (pin!=undefined) {
      this.logger.debug("Admin pin changed to: "+pin.toString());
      this.disk.pin = pin.toString();
    }
    this.dialog.closeAll();
  }

  cancel() {
    this.dialog.closeAll();
  }

}
