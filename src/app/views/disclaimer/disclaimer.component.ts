import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { Subscription } from 'rxjs';

import { DiskInterface } from '../../models/disk/disk.interface';
import { DiskModel } from '../../models/disk/disk.service';

@Component({
  selector: 'app-disclaimer-view',
  standalone: true,
  templateUrl: './disclaimer.component.html',
  styleUrl: './disclaimer.component.css',
  imports: [FormsModule, TranslateModule],
})
export class DisclaimerComponent implements OnInit, OnDestroy {
  private readonly dialog = inject(MatDialog);
  private readonly diskModel = inject(DiskModel);

  disk: DiskInterface;
  diskSubscription: Subscription | undefined;
  pin: number | undefined;
  copyrightYearRange: string;

  constructor() {
    this.disk = this.diskModel.getDisk();
    this.copyrightYearRange = '2015-' + new Date().getFullYear().toString();
  }

  ngOnInit(): void {
    this.diskSubscription = this.diskModel.diskSubject.subscribe((updatedDisk: DiskInterface) => {
      this.disk = updatedDisk;
    });
  }

  ngOnDestroy(): void {
    this.diskSubscription?.unsubscribe();
  }

  cancel() {
    this.dialog.closeAll();
  }
}
