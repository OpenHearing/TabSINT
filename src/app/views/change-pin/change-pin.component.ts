import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { Subscription } from 'rxjs';

import { DiskInterface } from '../../models/disk/disk.interface';
import { Logger } from '../../utilities/logger.service';
import { DiskModel } from '../../models/disk/disk.service';

@Component({
  selector: 'change-pin-view',
  standalone: true,
  templateUrl: './change-pin.component.html',
  styleUrl: './change-pin.component.css',
  imports: [FormsModule, TranslateModule]
})
export class ChangePinComponent {
  disk: DiskInterface;
  diskSubject: Subscription | undefined;
  pin: number | undefined;

  constructor(
    private readonly logger: Logger, 
    private readonly dialog: MatDialog, 
    private readonly diskModel: DiskModel
  ) {
    this.disk = this.diskModel.getDisk();
  }

  ngOnInit() {
    this.diskSubject = this.diskModel.diskSubject.subscribe( (updatedDisk: DiskInterface) => {
        this.disk = updatedDisk;
    })    
  }

  ngOnDestroy() {
    this.diskSubject?.unsubscribe();
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

}
