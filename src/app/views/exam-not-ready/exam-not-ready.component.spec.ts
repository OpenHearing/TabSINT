import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExamNotReadyComponent } from './exam-not-ready.component';

describe('ExamNotReadyComponent', () => {
  let component: ExamNotReadyComponent;
  let fixture: ComponentFixture<ExamNotReadyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ExamNotReadyComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ExamNotReadyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
