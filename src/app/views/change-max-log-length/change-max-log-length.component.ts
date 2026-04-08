import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { TranslocoPipe } from '@jsverse/transloco';
import { Subscription } from 'rxjs';

import { DiskInterface } from '../../models/disk/disk.interface';
import { Logger } from '../../services/logger.service';
import { DiskModel } from '../../models/disk/disk.service';

@Component({
  selector: 'app-change-max-log-length-view',
  standalone: true,
  templateUrl: './change-max-log-length.component.html',
  styleUrl: './change-max-log-length.component.css',
  imports: [FormsModule, TranslocoPipe],
})
export class ChangeMaxLogLengthComponent implements OnInit, OnDestroy {
  private readonly logger = inject(Logger);
  private readonly dialog = inject(MatDialog);
  private readonly diskModel = inject(DiskModel);

  disk: DiskInterface;
  diskSubscription: Subscription | undefined;
  maxLogLength: number | undefined;

  constructor() {
    this.disk = this.diskModel.getDisk();
    this.maxLogLength = this.disk.preferences.maxLogRows; // Initialize with the current max log length
  }

  ngOnInit(): void {
    this.diskSubscription = this.diskModel.diskSubject.subscribe((updatedDisk: DiskInterface) => {
      this.disk = updatedDisk;
    });
  }

  ngOnDestroy(): void {
    this.diskSubscription?.unsubscribe();
  }

  save(maxLogLength: number | undefined) {
    if (maxLogLength != undefined) {
      this.logger.debug('Max log length changed to: ' + maxLogLength);
      this.disk.preferences.maxLogRows = maxLogLength;
      this.diskModel.updatePreferences({ maxLogRows: maxLogLength });
    }
    this.dialog.closeAll();
  }

  cancel() {
    this.dialog.closeAll();
  }
}
