import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SingleResultModalComponent } from './single-result-modal.component';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { NgxJsonViewerModule } from 'ngx-json-viewer';
import { DiskModel } from '../../../models/disk/disk.service';
import { ResultsService } from '../../../controllers/results.service';
import { SqLite } from '../../../services/sqLite.service';
import { ResultsUploadService } from '../../../controllers/results-upload.service';
import { Notifications } from '../../../services/notifications.service';
import { Logger } from '../../../services/logger.service';

describe('SingleResultModalComponent', () => {
  let component: SingleResultModalComponent;
  let fixture: ComponentFixture<SingleResultModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SingleResultModalComponent],
      imports: [MatDialogModule, NgxJsonViewerModule],
      providers: [
        DiskModel,
        { provide: MAT_DIALOG_DATA, useValue: 0 },
        { provide: MatDialogRef, useValue: {} },
        { provide: ResultsService, useValue: {} },
        { provide: SqLite, useValue: {} },
        { provide: ResultsUploadService, useValue: {} },
        { provide: Notifications, useValue: {} },
        { provide: Logger, useValue: {} },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SingleResultModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
