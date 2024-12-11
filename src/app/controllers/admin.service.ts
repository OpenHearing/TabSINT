import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { ChangePinComponent } from '../views/change-pin/change-pin.component';
import { DiskModel } from '../models/disk/disk.service';
import { Subscription } from 'rxjs';
import { DiskInterface } from '../models/disk/disk.interface';

@Injectable({
    providedIn: 'root',
})

export class AdminService {
    disk: DiskInterface;
    diskSubscription: Subscription | undefined;
    constructor(
        private readonly dialog: MatDialog, private readonly router: Router,
        private readonly diskModel: DiskModel,
    ) {
        this.disk = this.diskModel.getDisk();
        this.diskSubscription = this.diskModel.diskSubject.subscribe((updatedDisk: DiskInterface) => {
            this.disk = updatedDisk;
        });
    }

    ngOnDestroy() {
        this.diskSubscription?.unsubscribe();
    }
    
    onAdminViewClick(): void {
        if (!this.disk.debugMode) {
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