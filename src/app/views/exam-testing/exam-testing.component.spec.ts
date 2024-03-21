import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExamTestingComponent } from './exam-testing.component';

describe('ExamTestingComponent', () => {
  let component: ExamTestingComponent;
  let fixture: ComponentFixture<ExamTestingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ExamTestingComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ExamTestingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
