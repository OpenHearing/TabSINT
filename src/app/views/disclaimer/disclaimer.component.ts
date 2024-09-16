import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

import { Logger } from '../../utilities/logger.service';
import { DiskInterface } from '../../models/disk/disk.interface';
import { DiskModel } from '../../models/disk/disk.service';

@Component({
  selector: 'disclaimer-view',
  standalone: true,
  templateUrl: './disclaimer.component.html',
  styleUrl: './disclaimer.component.css',
  imports: [FormsModule, TranslateModule]
})
export class DisclaimerComponent {
  disk: DiskInterface;
  pin: number | undefined;

  constructor(private logger: Logger, private dialog: MatDialog, private diskModel: DiskModel) {
    this.disk = this.diskModel.getDisk();
  }

  cancel() {
    this.dialog.closeAll();
  }

}
