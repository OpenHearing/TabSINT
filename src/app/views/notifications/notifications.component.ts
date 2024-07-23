import {Component, Inject} from '@angular/core';
import {
  MatDialog,
  MAT_DIALOG_DATA,
  MatDialogContent
} from '@angular/material/dialog';
import {MatButtonModule} from '@angular/material/button';

import { DialogDataInterface } from '../../interfaces/dialog-data.interface';
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
    @Inject(MAT_DIALOG_DATA) public data: DialogDataInterface,
  ) {}

  
  cancel() {
    this.dialog.closeAll();
  }

}
