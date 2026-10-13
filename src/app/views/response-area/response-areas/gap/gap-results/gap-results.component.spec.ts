import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslocoTestingModule } from '@jsverse/transloco';

import { GapResultsComponent } from './gap-results.component';
import { GapResultsInterface } from '../gap.interface';

describe('GapResultsComponent', () => {
  let component: GapResultsComponent;
  let fixture: ComponentFixture<GapResultsComponent>;

  const results: GapResultsInterface = {
    GapThreshold: 12,
    GapLengthArray: [5, 10, 20],
    HitOrMissArray: [true, false, true],
    ReversalUsedForThresholdArray: [false, true, false],
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [GapResultsComponent],
      imports: [
        TranslocoTestingModule.forRoot({ langs: { en: {} }, translocoConfig: { availableLangs: ['en'], defaultLang: 'en' }, preloadLangs: true }),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(GapResultsComponent);
    component = fixture.componentInstance;
    component.results = results;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('zips the parallel gap/hit/reversal arrays into one row per trial', () => {
    expect(component.trials).toEqual([
      { gapLength: 5, hit: true, reversal: false },
      { gapLength: 10, hit: false, reversal: true },
      { gapLength: 20, hit: true, reversal: false },
    ]);
  });

  it('renders a row per trial', () => {
    const rows = fixture.nativeElement.querySelectorAll('.results-table tbody tr');
    expect(rows.length).toBe(3);
  });

  it('treats missing hit/reversal arrays as all-false', () => {
    component.results = { GapLengthArray: [5] };
    expect(component.trials).toEqual([{ gapLength: 5, hit: false, reversal: false }]);
  });
});
