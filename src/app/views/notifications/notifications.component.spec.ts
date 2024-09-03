import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NotificationsComponent } from './notifications.component';
import { TranslateFakeLoader, TranslateLoader, TranslateModule, TranslateService, TranslateStore } from '@ngx-translate/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef, MatDialogContent } from '@angular/material/';

describe('NotificationsComponent', () => {
  let component: NotificationsComponent;
  let fixture: ComponentFixture<NotificationsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [NotificationsComponent],
      imports: [MatDialogModule,
        MatDialogContent,
        TranslateModule.forRoot({
                  loader: {
                    provide: TranslateLoader,
                    useClass: TranslateFakeLoader
                  }
                })],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: {} },
        { provide: MatDialogRef, useValue: {} },
        TranslateService, 
        TranslateStore]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(NotificationsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
