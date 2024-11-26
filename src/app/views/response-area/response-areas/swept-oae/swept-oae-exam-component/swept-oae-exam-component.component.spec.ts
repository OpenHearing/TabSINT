import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SweptOaeExamComponentComponent } from './swept-oae-exam-component.component';

describe('SweptOaeExamComponentComponent', () => {
  let component: SweptOaeExamComponentComponent;
  let fixture: ComponentFixture<SweptOaeExamComponentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SweptOaeExamComponentComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SweptOaeExamComponentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
