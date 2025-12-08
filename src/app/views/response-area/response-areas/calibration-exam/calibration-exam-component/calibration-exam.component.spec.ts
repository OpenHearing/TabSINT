import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CalibrationExamComponent } from './calibration-exam.component';
import { CalibrationScreenComponent } from '../calibration-screen/calibration-screen.component';
import { FormsModule } from '@angular/forms';
import { TranslateFakeLoader, TranslateLoader, TranslateModule, TranslateService, TranslateStore } from '@ngx-translate/core';

describe('CalibrationExamComponent', () => {
  let component: CalibrationExamComponent;
  let fixture: ComponentFixture<CalibrationExamComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CalibrationExamComponent, CalibrationScreenComponent],
      imports: [
        FormsModule,
        TranslateModule.forRoot({
          loader: {
            provide: TranslateLoader,
            useClass: TranslateFakeLoader,
          },
        }),
      ],
      providers: [TranslateService, TranslateStore],
    }).compileComponents();

    fixture = TestBed.createComponent(CalibrationExamComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
