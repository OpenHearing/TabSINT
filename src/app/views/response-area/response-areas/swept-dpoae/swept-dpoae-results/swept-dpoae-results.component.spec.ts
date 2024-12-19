import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SweptDpoaeResultsComponent } from './swept-dpoae-results.component';

describe('SweptDpoaeResultsComponent', () => {
  let component: SweptDpoaeResultsComponent;
  let fixture: ComponentFixture<SweptDpoaeResultsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SweptDpoaeResultsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SweptDpoaeResultsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
