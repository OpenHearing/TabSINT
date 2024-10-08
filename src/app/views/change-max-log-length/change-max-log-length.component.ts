import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { Subscription } from 'rxjs';

import { DiskInterface } from '../../models/disk/disk.interface';
import { Logger } from '../../utilities/logger.service';
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
  diskSubject: Subscription | undefined;
  maxLogLength: number | undefined;

  constructor(
    private readonly logger: Logger, 
    private readonly dialog: MatDialog, 
    private readonly diskModel: DiskModel
  ) {
    this.disk = this.diskModel.getDisk();
    this.maxLogLength = this.disk.maxLogRows; // Initialize with the current max log length
  }

  ngOnInit() {
    this.diskSubject = this.diskModel.diskSubject.subscribe( (updatedDisk: DiskInterface) => {
        this.disk = updatedDisk;
    })    
  }

  ngOnDestroy() {
    this.diskSubject?.unsubscribe();
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
