import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CalibrationResultsViewerComponent } from './calibration-results-viewer.component';

describe('CalibrationResultsViewerComponent', () => {
  let component: CalibrationResultsViewerComponent;
  let fixture: ComponentFixture<CalibrationResultsViewerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CalibrationResultsViewerComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CalibrationResultsViewerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
