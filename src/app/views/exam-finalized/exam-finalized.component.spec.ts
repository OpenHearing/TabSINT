import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExamFinalizedComponent } from './exam-finalized.component';

describe('ExamFinalizedComponent', () => {
  let component: ExamFinalizedComponent;
  let fixture: ComponentFixture<ExamFinalizedComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ExamFinalizedComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ExamFinalizedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
