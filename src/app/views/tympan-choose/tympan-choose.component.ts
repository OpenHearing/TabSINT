import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { Logger } from '../../utilities/logger.service';
import { DiskInterface } from '../../models/disk/disk.interface';
import { DiskModel } from '../../models/disk/disk.service';
import { NgFor, NgClass } from '@angular/common';
import { BleDevice } from '../../interfaces/bluetooth.interface';

@Component({
  selector: 'tympan-choose-view',
  standalone: true,
  templateUrl: './tympan-choose.component.html',
  styleUrl: './tympan-choose.component.css',
  imports: [FormsModule, TranslateModule, NgFor, NgClass]
})
export class TympanChooseComponent {
  disk: DiskInterface;
  availableTympans: Array<BleDevice>;
  selectedTympan: BleDevice | undefined;

  constructor(
    public logger: Logger, 
    public dialogRef: MatDialogRef<TympanChooseComponent>,
    public diskModel: DiskModel, 
    @Inject(MAT_DIALOG_DATA) public data:any
  ) {
    this.disk = this.diskModel.getDisk();
    this.availableTympans = data;
  }

  choose(tympan:BleDevice) {
    this.selectedTympan = tympan;
  }

  select() {
    this.dialogRef.close(this.selectedTympan);
  }

  cancel() {
    this.dialogRef.close(undefined);
  }

}
