import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CalibrationExamComponent } from './calibration-exam.component';

describe('CalibrationExamComponent', () => {
  let component: CalibrationExamComponent;
  let fixture: ComponentFixture<CalibrationExamComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CalibrationExamComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CalibrationExamComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
