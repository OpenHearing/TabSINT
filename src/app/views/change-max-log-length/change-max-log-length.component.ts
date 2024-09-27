import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

import { Logger } from '../../utilities/logger.service';
import { DiskInterface } from '../../models/disk/disk.interface';
import { DiskModel } from '../../models/disk/disk.service';

@Component({
  selector: 'change-max-log-length-view',
  standalone: true,
  templateUrl: './change-max-log-length.component.html',
  styleUrl: './change-max-log-length.component.css',
  imports: [FormsModule, TranslateModule]
})
export class ChangeMaxLogLengthComponent {
  disk: DiskInterface;
  maxLogLength: number | undefined;

  constructor(private logger: Logger, private dialog: MatDialog, private diskModel: DiskModel) {
    this.disk = this.diskModel.getDisk();
    this.maxLogLength = this.disk.maxLogRows; // Initialize with the current max log length
  }

  save(maxLogLength: number | undefined) {
    if (maxLogLength != undefined) {
      this.logger.debug("Max log length changed to: " + maxLogLength);
      this.disk.maxLogRows = maxLogLength;
      this.diskModel.updateDiskModel('maxLogRows', maxLogLength);
    }
    this.dialog.closeAll();
  }

  cancel() {
    this.dialog.closeAll();
  }
}
