import { Injectable } from '@angular/core';
import { DialogData } from '../interfaces/dialog-data.interface';
import { NotificationsComponent } from '../views/notifications/notifications.component';
import { MatDialog } from '@angular/material/dialog';
import { Observable } from 'rxjs/internal/Observable';

@Injectable({
    providedIn: 'root',
})

export class Notifications {

    constructor(public dialog: MatDialog) {}
    
    confirm(dialogData: DialogData): Observable<string> {
      
      const dialogRef = this.dialog.open(NotificationsComponent, {
        data: dialogData
      });

      return dialogRef.afterClosed();
    }
    
    alert(dialogData: DialogData): Observable<string> {
      
        const dialogRef = this.dialog.open(NotificationsComponent, {
          data: dialogData
        });
  
        return dialogRef.afterClosed();
      }
      
}