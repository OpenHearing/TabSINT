import { Component, EventEmitter, Output, OnInit, OnDestroy, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { TranslocoModule } from '@jsverse/transloco';
import { Subscription } from 'rxjs';
import { DiskInterface } from '../../models/disk/disk.interface';
import { Logger } from '../../services/logger.service';
import { DiskModel } from '../../models/disk/disk.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-change-pin-view',
  standalone: true,
  templateUrl: './change-pin.component.html',
  styleUrl: './change-pin.component.css',
  imports: [CommonModule, FormsModule, TranslocoModule],
})
export class ChangePinComponent implements OnInit, OnDestroy {
  private readonly logger = inject(Logger);
  private readonly dialog = inject(MatDialog);
  private readonly diskModel = inject(DiskModel);

  disk: DiskInterface;
  diskSubscription: Subscription | undefined;
  pin: number | undefined;
  isValidationMode: boolean = false;
  @Output() pinValidated = new EventEmitter<boolean>();

  constructor() {
    this.disk = this.diskModel.getDisk();
  }

  ngOnInit(): void {
    this.diskSubscription = this.diskModel.diskSubject.subscribe((updatedDisk: DiskInterface) => {
      this.disk = updatedDisk;
    });
  }

  ngOnDestroy(): void {
    this.diskSubscription?.unsubscribe();
  }

  setValidationMode(validationMode: boolean) {
    this.isValidationMode = validationMode;
  }

  save(pin: number | undefined) {
    if (pin != undefined) {
      this.logger.debug('Admin pin changed to: ' + pin.toString());
      this.disk.preferences.pin = pin.toString();
      this.diskModel.updatePreferences({ pin: this.disk.preferences.pin });
    }
    this.dialog.closeAll();
  }

  cancel() {
    this.dialog.closeAll();
  }

  validatePin() {
    if (this.isValidationMode && this.pin?.toString() === this.disk.preferences.pin) {
      this.logger.debug('Admin PIN validated successfully');
      this.pinValidated.emit(true);
      this.dialog.closeAll();
    } else {
      alert('Incorrect PIN');
      this.pinValidated.emit(false);
    }
  }
}
