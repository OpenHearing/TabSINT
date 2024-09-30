import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DeviceChooseComponent } from './device-choose.component';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { TranslateFakeLoader, TranslateLoader, TranslateModule, TranslateService, TranslateStore } from '@ngx-translate/core';

describe('DeviceChooseComponent', () => {
  let component: DeviceChooseComponent;
  let fixture: ComponentFixture<DeviceChooseComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [],
      imports: [
        DeviceChooseComponent, 
        MatDialogModule, 
        TranslateModule.forRoot({
                  loader: {
                    provide: TranslateLoader,
                    useClass: TranslateFakeLoader
                  }
                })
      ],
      providers: [
        TranslateService, 
        TranslateStore,
        { provide: MatDialogRef, useValue: {} },
        { provide: MAT_DIALOG_DATA, useValue: {} },
     ],
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DeviceChooseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
