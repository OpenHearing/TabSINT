import { Component, Inject } from '@angular/core';

import { DiskModel } from '../../../models/disk/disk.service';
import { DiskInterface } from '../../../models/disk/disk.interface';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ExamResults } from '../../../models/results/results.interface';

@Component({
  selector: 'app-single-result-modal',
  templateUrl: './single-result-modal.component.html',
  styleUrl: './single-result-modal.component.css'
})
export class SingleResultModalComponent {

  constructor(
    // public dialog: MatDialog, 
    @Inject(MAT_DIALOG_DATA) public data: ExamResults,
  ) {
    console.log("data: ", data);
  }

  upload() {

  }

  export() {

  }

  delete() {

  }

  close() {

  }


}
