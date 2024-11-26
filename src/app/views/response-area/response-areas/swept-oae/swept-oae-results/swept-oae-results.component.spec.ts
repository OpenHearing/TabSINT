import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SweptOaeResultsComponent } from './swept-oae-results.component';

describe('SweptOaeResultsComponent', () => {
  let component: SweptOaeResultsComponent;
  let fixture: ComponentFixture<SweptOaeResultsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SweptOaeResultsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SweptOaeResultsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
