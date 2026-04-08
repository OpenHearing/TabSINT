import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CalibrationExamComponent } from './calibration-exam.component';
import { CalibrationScreenComponent } from '../calibration-screen/calibration-screen.component';
import { FormsModule } from '@angular/forms';
import { TranslocoTestingModule } from '@jsverse/transloco';

describe('CalibrationExamComponent', () => {
  let component: CalibrationExamComponent;
  let fixture: ComponentFixture<CalibrationExamComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CalibrationExamComponent, CalibrationScreenComponent],
      imports: [
        FormsModule,
        TranslocoTestingModule.forRoot({ langs: { en: {} }, translocoConfig: { availableLangs: ['en'], defaultLang: 'en' }, preloadLangs: true }),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CalibrationExamComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
