import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExamDeviceErrorComponent } from './exam-device-error.component';

describe('ExamDeviceErrorComponent', () => {
  let component: ExamDeviceErrorComponent;
  let fixture: ComponentFixture<ExamDeviceErrorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ExamDeviceErrorComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ExamDeviceErrorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
