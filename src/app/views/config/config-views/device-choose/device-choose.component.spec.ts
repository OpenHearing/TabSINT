import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DeviceChooseComponent } from './device-choose.component';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { TranslocoTestingModule } from '@jsverse/transloco';

describe('DeviceChooseComponent', () => {
  let component: DeviceChooseComponent;
  let fixture: ComponentFixture<DeviceChooseComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [],
      imports: [
        DeviceChooseComponent,
        MatDialogModule,
        TranslocoTestingModule.forRoot({ langs: { en: {} }, translocoConfig: { availableLangs: ['en'], defaultLang: 'en' }, preloadLangs: true }),
      ],
      providers: [, { provide: MatDialogRef, useValue: {} }, { provide: MAT_DIALOG_DATA, useValue: {} }],
    }).compileComponents();

    fixture = TestBed.createComponent(DeviceChooseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
