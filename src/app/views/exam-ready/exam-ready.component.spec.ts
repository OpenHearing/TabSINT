import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExamReadyComponent } from './exam-ready.component';

describe('ExamReadyComponent', () => {
  let component: ExamReadyComponent;
  let fixture: ComponentFixture<ExamReadyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ExamReadyComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ExamReadyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
