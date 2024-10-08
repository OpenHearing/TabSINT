import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { Subscription } from 'rxjs';

import { DiskInterface } from '../../models/disk/disk.interface';
import { DiskModel } from '../../models/disk/disk.service';

@Component({
  selector: 'disclaimer-view',
  standalone: true,
  templateUrl: './disclaimer.component.html',
  styleUrl: './disclaimer.component.css',
  imports: [FormsModule, TranslateModule]
})
export class DisclaimerComponent {
  disk: DiskInterface;
  diskSubject: Subscription | undefined;
  pin: number | undefined;

  constructor(
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

  cancel() {
    this.dialog.closeAll();
  }

}
