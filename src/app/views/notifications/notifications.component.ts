import {Component, Inject} from '@angular/core';
import {
  MatDialog,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';
import {MatButtonModule} from '@angular/material/button';

import { DialogData } from '../../interfaces/dialog-data.interface';
import { DialogType } from '../../utilities/constants';

@Component({
  selector: 'confirmation-dialog',
  templateUrl: './notifications.component.html',
  styleUrl: './notifications.component.css'
})
export class NotificationsComponent {
  dialogTypeConfirm = DialogType.Confirm;

  constructor(
    public dialog: MatDialog, 
    @Inject(MAT_DIALOG_DATA) public data: DialogData,
  ) {}

  
  cancel() {
    this.dialog.closeAll();
  }

}
