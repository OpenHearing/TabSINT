import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslocoTestingModule } from '@jsverse/transloco';

import { ChangeTabsintIdComponent } from './change-tabsint-id.component';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Logger } from '../../services/logger.service';
import { DevicesService } from '../../services/devices/devices.service';

describe('ChangeTabsintIdComponent', () => {
  let component: ChangeTabsintIdComponent;
  let fixture: ComponentFixture<ChangeTabsintIdComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ChangeTabsintIdComponent,
        TranslocoTestingModule.forRoot({ langs: { en: {} }, translocoConfig: { availableLangs: ['en'], defaultLang: 'en' }, preloadLangs: true }),
      ],
      providers: [
        { provide: MatDialog, useValue: {} },
        { provide: MatDialogRef, useValue: {} },
        { provide: MAT_DIALOG_DATA, useValue: {} },
        { provide: DevicesService, useValue: {} },
        { provide: Logger, useValue: {} },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ChangeTabsintIdComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
