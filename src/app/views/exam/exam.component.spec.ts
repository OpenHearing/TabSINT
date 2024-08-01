import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateFakeLoader, TranslateLoader, TranslateModule, TranslateService, TranslateStore } from '@ngx-translate/core';

import { ExamComponent } from './exam.component';
import { HeaderComponent } from '../header/header.component';
import { DebugComponent } from '../debug/debug.component';
import { IndicatorComponent } from '../indicator/indicator.component';
import { MatMenuModule } from '@angular/material/menu';
import { ExamNotReadyComponent } from '../exam-not-ready/exam-not-ready.component';
import { MAT_DIALOG_DATA, MatDialogContent, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { NotificationsComponent } from '../notifications/notifications.component';

describe('ExamComponent', () => {
  let component: ExamComponent;
  let fixture: ComponentFixture<ExamComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [
        ExamComponent, 
        HeaderComponent, 
        DebugComponent, 
        IndicatorComponent, 
        ExamNotReadyComponent,
        NotificationsComponent
      ],
      imports: [
        MatMenuModule,
        MatDialogModule,
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
        TranslateStore
      ]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ExamComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
