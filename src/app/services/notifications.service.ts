import { Injectable, inject } from '@angular/core';
import { DialogDataInterface } from '../interfaces/dialog-data.interface';
import { NotificationsComponent } from '../views/notifications/notifications.component';
import { MatDialog } from '@angular/material/dialog';
import { Observable } from 'rxjs/internal/Observable';

@Injectable({
  providedIn: 'root',
})
export class Notifications {
  private readonly dialog = inject(MatDialog);

  alert(dialogData: DialogDataInterface): Observable<string> {
    const dialogRef = this.dialog.open(NotificationsComponent, {
      data: dialogData,
    });

    return dialogRef.afterClosed();
  }
}
