import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SweptOaeInputParametersComponentComponent } from './swept-oae-input-parameters.component';

describe('SweptOaeInputParametersComponentComponent', () => {
  let component: SweptOaeInputParametersComponentComponent;
  let fixture: ComponentFixture<SweptOaeInputParametersComponentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SweptOaeInputParametersComponentComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SweptOaeInputParametersComponentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
