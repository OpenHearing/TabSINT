import { Component, inject } from '@angular/core';
import { MatDialog, MAT_DIALOG_DATA } from '@angular/material/dialog';

import { DialogDataInterface } from '../../interfaces/dialog-data.interface';
import { DialogType } from '../../utilities/constants';

@Component({
  selector: 'app-confirmation-dialog',
  templateUrl: './notifications.component.html',
  styleUrl: './notifications.component.css',
})
export class NotificationsComponent {
  readonly dialog = inject(MatDialog);
  readonly data = inject<DialogDataInterface>(MAT_DIALOG_DATA);

  dialogTypeConfirm = DialogType.Confirm;

  cancel() {
    this.dialog.closeAll();
  }
}
