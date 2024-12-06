import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SweptOaeExamComponent } from './swept-oae-exam.component';

describe('SweptOaeExamComponent', () => {
  let component: SweptOaeExamComponent;
  let fixture: ComponentFixture<SweptOaeExamComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SweptOaeExamComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SweptOaeExamComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
