import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslocoTestingModule } from '@jsverse/transloco';

import { SswResultsComponent } from './ssw-results.component';
import { SswPresentationResultInterface } from '../ssw.interface';

describe('SswResultsComponent', () => {
  let component: SswResultsComponent;
  let fixture: ComponentFixture<SswResultsComponent>;

  const presentation = (overrides: Partial<SswPresentationResultInterface>): SswPresentationResultInterface => ({
    responseStartTime: '2026-01-01T00:00:00.000Z',
    responseElapTimeMS: 1500,
    firstEar: 'left',
    words: ['air', 'plane', 'wet', 'paint'],
    response: [1, 2, 3, 4],
    numberCorrect: 4,
    wordCount: 4,
    correct: true,
    responseToCha: [1, 2, 3, 4],
    notes: '',
    ...overrides,
  });

  const presentations: SswPresentationResultInterface[] = [
    presentation({}),
    presentation({ firstEar: 'right', response: [1, 0, 4, 3], responseToCha: [1, 0, 4, 3], numberCorrect: 3, correct: false, notes: 'hesitated' }),
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SswResultsComponent],
      imports: [
        TranslocoTestingModule.forRoot({ langs: { en: {} }, translocoConfig: { availableLangs: ['en'], defaultLang: 'en' }, preloadLangs: true }),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SswResultsComponent);
    component = fixture.componentInstance;
    component.presentations = presentations;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('counts only presentations with every word repeated in order as correct', () => {
    expect(component.correctPresentationCount).toBe(1);
    expect(fixture.nativeElement.querySelector('.ssw-score')?.textContent).toContain('1/2');
  });

  it('marks each word correct or incorrect from its order value', () => {
    expect(component.wordResults(presentations[1])).toEqual(['Y', 'N', 'Y', 'Y']);
  });

  it('renders one row per presentation with ear, words, order, score, result, and comments', () => {
    const rows: NodeListOf<HTMLTableRowElement> = fixture.nativeElement.querySelectorAll('.results-table tbody tr');
    expect(rows.length).toBe(2);
    const cells = rows[1].querySelectorAll('td');
    expect(cells[0].textContent?.trim()).toBe('2');
    expect(cells[1].textContent?.trim()).toBe('right');
    expect(cells[2].textContent?.trim()).toBe('air plane wet paint');
    expect(cells[3].textContent?.trim()).toBe('[1, 0, 4, 3]');
    expect(cells[4].textContent?.trim()).toBe('3/4');
    expect(cells[5].textContent?.trim()).toBe('[Y, N, Y, Y]');
    expect(cells[6].textContent?.trim()).toBe('hesitated');
  });
});
