import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { CalibrationScreenComponent } from './calibration-screen.component';

describe('CalibrationScreenComponent', () => {
  let component: CalibrationScreenComponent;
  let fixture: ComponentFixture<CalibrationScreenComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CalibrationScreenComponent],
      imports: [FormsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(CalibrationScreenComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
