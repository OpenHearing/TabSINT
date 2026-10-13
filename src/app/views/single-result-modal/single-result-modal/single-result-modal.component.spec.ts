import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { of } from 'rxjs';

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
  let resultsServiceSpy: jasmine.SpyObj<ResultsService>;
  let notificationsSpy: jasmine.SpyObj<Notifications>;

  beforeEach(async () => {
    resultsServiceSpy = jasmine.createSpyObj('ResultsService', ['deleteSingleResult', 'getSingleResult']);
    notificationsSpy = jasmine.createSpyObj('Notifications', ['alert']);

    await TestBed.configureTestingModule({
      declarations: [SingleResultModalComponent],
      imports: [
        MatDialogModule,
        NgxJsonViewerModule,
        TranslocoTestingModule.forRoot({ langs: { en: {} }, translocoConfig: { availableLangs: ['en'], defaultLang: 'en' }, preloadLangs: true }),
      ],
      providers: [
        DiskModel,
        { provide: MAT_DIALOG_DATA, useValue: 0 },
        { provide: MatDialogRef, useValue: {} },
        { provide: ResultsService, useValue: resultsServiceSpy },
        { provide: SqLite, useValue: {} },
        { provide: ResultsUploadService, useValue: {} },
        { provide: Notifications, useValue: notificationsSpy },
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

  it('confirmDelete should prompt and delete the result when confirmed', () => {
    notificationsSpy.alert.and.returnValue(of('OK'));

    component.confirmDelete();

    expect(notificationsSpy.alert).toHaveBeenCalled();
    expect(resultsServiceSpy.deleteSingleResult).toHaveBeenCalledWith(component.index);
  });

  it('confirmDelete should not delete the result when cancelled', () => {
    notificationsSpy.alert.and.returnValue(of('Cancel'));

    component.confirmDelete();

    expect(notificationsSpy.alert).toHaveBeenCalled();
    expect(resultsServiceSpy.deleteSingleResult).not.toHaveBeenCalled();
  });
});
