import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { AudiometryLegendComponent } from './audiometry-legend.component';

describe('AudiometryLegendComponent', () => {
  let component: AudiometryLegendComponent;
  let fixture: ComponentFixture<AudiometryLegendComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AudiometryLegendComponent],
      imports: [
        TranslocoTestingModule.forRoot({ langs: { en: {} }, translocoConfig: { availableLangs: ['en'], defaultLang: 'en' }, preloadLangs: true }),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AudiometryLegendComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
