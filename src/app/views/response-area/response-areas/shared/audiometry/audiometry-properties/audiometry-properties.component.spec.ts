import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { InputParametersComponent } from '../../input-parameters/input-parameters.component';
import { AudiometryPropertiesComponent } from './audiometry-properties.component';

describe('AudiometryPropertiesComponent', () => {
  let component: AudiometryPropertiesComponent;
  let fixture: ComponentFixture<AudiometryPropertiesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AudiometryPropertiesComponent, InputParametersComponent],
      imports: [
        TranslocoTestingModule.forRoot({ langs: { en: {} }, translocoConfig: { availableLangs: ['en'], defaultLang: 'en' }, preloadLangs: true }),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AudiometryPropertiesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('builds an empty parameter map when nothing is set', () => {
    expect(component.parameterMap.size).toBe(0);
  });

  it('includes level, frequency and ear once set', () => {
    component.level = 40;
    component.levelUnits = 'dB HL';
    component.frequency = 2;
    component.ear = 'Left';
    component.ngOnChanges();

    expect(component.parameterMap.get('Level')).toBe('40 dB HL');
    expect(component.parameterMap.get('Frequency')).toBe('2 kHz');
    expect(component.parameterMap.get('Ear')).toBe('Left');
  });

  it('uses a custom level label when provided', () => {
    component.level = 90;
    component.levelLabel = 'Fixed Level';
    component.ngOnChanges();

    expect(component.parameterMap.has('Fixed Level')).toBe(true);
    expect(component.parameterMap.has('Level')).toBe(false);
  });
});
