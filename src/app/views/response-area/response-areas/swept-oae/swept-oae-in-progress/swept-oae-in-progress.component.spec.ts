import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SweptOaeInProgressComponentComponent } from './swept-oae-in-progress.component';

describe('SweptOaeInProgressComponentComponent', () => {
  let component: SweptOaeInProgressComponentComponent;
  let fixture: ComponentFixture<SweptOaeInProgressComponentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SweptOaeInProgressComponentComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SweptOaeInProgressComponentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
