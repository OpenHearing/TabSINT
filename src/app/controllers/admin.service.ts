import { Injectable, OnDestroy, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { ChangePinComponent } from '../views/change-pin/change-pin.component';
import { DiskModel } from '../models/disk/disk.service';
import { Subscription } from 'rxjs';
import { DiskInterface } from '../models/disk/disk.interface';

@Injectable({
  providedIn: 'root',
})
export class AdminService implements OnDestroy {
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);
  private readonly diskModel = inject(DiskModel);

  disk: DiskInterface;
  diskSubscription: Subscription | undefined;

  constructor() {
    this.disk = this.diskModel.getDisk();
    this.diskSubscription = this.diskModel.diskSubject.subscribe((updatedDisk: DiskInterface) => {
      this.disk = updatedDisk;
    });
  }

  ngOnDestroy(): void {
    this.diskSubscription?.unsubscribe();
  }

  onAdminViewClick(): void {
    if (!this.disk.preferences.debugMode) {
      const dialogRef = this.dialog.open(ChangePinComponent);
      dialogRef.componentInstance.setValidationMode(true);
      dialogRef.componentInstance.pinValidated.subscribe((isValid: boolean) => {
        if (isValid) {
          this.router.navigate(['/admin']);
        }
      });
    } else {
      this.router.navigate(['/admin']);
    }
  }
}
