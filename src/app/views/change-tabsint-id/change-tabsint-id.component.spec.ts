import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateFakeLoader, TranslateLoader, TranslateModule, TranslateService, TranslateStore } from '@ngx-translate/core';

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
        TranslateModule.forRoot({
          loader: {
            provide: TranslateLoader,
            useClass: TranslateFakeLoader,
          },
        }),
      ],
      providers: [
        TranslateService,
        TranslateStore,
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
