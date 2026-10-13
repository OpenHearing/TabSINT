import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslocoTestingModule } from '@jsverse/transloco';

import { ThreeDigitResultsComponent } from './three-digit-results.component';
import { ThreeDigitPresentationResultInterface } from '../three-digit.interface';
import { TrialProgressionPlotComponent } from '../../shared/trial-progression-plot/trial-progression-plot.component';

describe('ThreeDigitResultsComponent', () => {
  let component: ThreeDigitResultsComponent;
  let fixture: ComponentFixture<ThreeDigitResultsComponent>;

  const presentations: ThreeDigitPresentationResultInterface[] = [
    {
      responseStartTime: '2026-01-01T00:00:00.000Z',
      response: ['1', '2', '3'],
      currentDigits: ['1', '2', '4'],
      currentSNR: -9,
      numberCorrect: 2,
      numberIncorrect: 1,
      eachCorrect: [true, true, false],
      correct: false,
    },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ThreeDigitResultsComponent, TrialProgressionPlotComponent],
      imports: [
        TranslocoTestingModule.forRoot({ langs: { en: {} }, translocoConfig: { availableLangs: ['en'], defaultLang: 'en' }, preloadLangs: true }),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ThreeDigitResultsComponent);
    component = fixture.componentInstance;
    component.presentations = presentations;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('marks each digit correct or incorrect based on the graded response', () => {
    expect(component.digitResults(presentations[0])).toEqual(['Y', 'Y', 'N']);
  });

  it('renders one row per presentation with SNR and result', () => {
    const cells: NodeListOf<HTMLTableCellElement> = fixture.nativeElement.querySelectorAll('.results-table tbody tr td');
    expect(cells[0].textContent?.trim()).toBe('1');
    expect(cells[1].textContent?.trim()).toBe('-9');
    expect(cells[2].textContent?.trim()).toBe('[Y, Y, N]');
  });

  it('builds SNR-progression plot data with per-point styling and no reference line', () => {
    expect(component.snrProgressionData).toEqual({
      y: [-9],
      pointStyles: ['open'],
      connectLine: true,
      referenceLine: undefined,
      xLabel: 'Presentation #',
      yLabel: 'SNR (dB)',
      title: 'SNR Progression',
    });
  });

  it('omits the SNR-progression plot when there are no presentations', () => {
    component.presentations = [];
    expect(component.snrProgressionData).toBeUndefined();
  });
});
