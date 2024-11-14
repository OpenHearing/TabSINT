import { Component, EventEmitter, Output } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { DiskInterface } from '../../models/disk/disk.interface';
import { Logger } from '../../utilities/logger.service';
import { DiskModel } from '../../models/disk/disk.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'change-pin-view',
  standalone: true,
  templateUrl: './change-pin.component.html',
  styleUrl: './change-pin.component.css',
  imports: [CommonModule,FormsModule, TranslateModule]
})
export class ChangePinComponent {
  disk: DiskInterface;
  diskSubscription: Subscription | undefined;
  pin: number | undefined;
  isValidationMode: boolean = false;
  @Output() pinValidated = new EventEmitter<boolean>();

  constructor(
    private readonly logger: Logger, 
    private readonly dialog: MatDialog, 
    private readonly diskModel: DiskModel
  ) {
    this.disk = this.diskModel.getDisk();
  }

  ngOnInit() {
    this.diskSubscription = this.diskModel.diskSubject.subscribe( (updatedDisk: DiskInterface) => {
        this.disk = updatedDisk;
    })    
  }

  ngOnDestroy() {
    this.diskSubscription?.unsubscribe();
  }

  setValidationMode(validationMode: boolean) {
    this.isValidationMode = validationMode;
  }

  save(pin:number | undefined) {
    if (pin!=undefined) {
      this.logger.debug("Admin pin changed to: "+pin.toString());
      this.disk.pin = pin.toString();
      this.diskModel.updateDiskModel('pin', this.disk.pin);
    }
    this.dialog.closeAll();
  }

  cancel() {
    this.dialog.closeAll();
  }

  validatePin() {
    if (this.isValidationMode && this.pin?.toString() === this.diskModel.getDisk().pin) {
      this.logger.debug('Admin PIN validated successfully');
      this.pinValidated.emit(true); 
      this.dialog.closeAll();
    } else {
      alert('Incorrect PIN');
      this.pinValidated.emit(false); 
    }
  }

}
