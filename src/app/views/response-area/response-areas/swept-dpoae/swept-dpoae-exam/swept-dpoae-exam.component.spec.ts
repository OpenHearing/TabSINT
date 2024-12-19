import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SweptDpoaeExamComponent } from './swept-dpoae-exam.component';

describe('SweptDpoaeExamComponent', () => {
  let component: SweptDpoaeExamComponent;
  let fixture: ComponentFixture<SweptDpoaeExamComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SweptDpoaeExamComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SweptDpoaeExamComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
