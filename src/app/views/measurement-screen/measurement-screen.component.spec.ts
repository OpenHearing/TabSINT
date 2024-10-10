import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MeasurementScreenComponent } from './measurement-screen.component';

describe('MeasurementScreenComponent', () => {
  let component: MeasurementScreenComponent;
  let fixture: ComponentFixture<MeasurementScreenComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MeasurementScreenComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(MeasurementScreenComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
