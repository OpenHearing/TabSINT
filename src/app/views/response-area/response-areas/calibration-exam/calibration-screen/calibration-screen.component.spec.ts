import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { CalibrationScreenComponent } from './calibration-screen.component';

describe('CalibrationScreenComponent', () => {
  let component: CalibrationScreenComponent;
  let fixture: ComponentFixture<CalibrationScreenComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CalibrationScreenComponent],
      imports: [
        FormsModule,
        TranslocoTestingModule.forRoot({ langs: { en: {} }, translocoConfig: { availableLangs: ['en'], defaultLang: 'en' }, preloadLangs: true }),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CalibrationScreenComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
