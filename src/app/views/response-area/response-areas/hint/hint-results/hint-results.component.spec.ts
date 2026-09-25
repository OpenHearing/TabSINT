import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslocoTestingModule } from '@jsverse/transloco';

import { HintResultsComponent } from './hint-results.component';
import { HintDirection, HintExamSummaryInterface, HintLanguage, HintPresentationResultInterface } from '../hint.interface';

describe('HintResultsComponent', () => {
  let component: HintResultsComponent;
  let fixture: ComponentFixture<HintResultsComponent>;

  const presentations: HintPresentationResultInterface[] = [
    {
      responseStartTime: '2026-01-01T00:00:00.000Z',
      sentence: ['the', 'big', 'dog', 'ran'],
      response: [1, 2, 3],
      selectedWords: ['big', 'dog', 'ran'],
      numberCorrect: 3,
      wordCount: 4,
      correct: false,
      responseToCha: 14,
      snr: -14,
    },
  ];

  const summary: HintExamSummaryInterface = {
    srt: -11.5,
    protocolName: 'Swahili Noise Right',
    examType: HintLanguage.Swahili,
    direction: HintDirection.Right,
    scoring: 'word',
    listNumber: 5,
    startDateTime: '2016-06-09T14:30:00.000Z',
    endDateTime: '2016-06-09T14:32:00.000Z',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [HintResultsComponent],
      imports: [
        TranslocoTestingModule.forRoot({ langs: { en: {} }, translocoConfig: { availableLangs: ['en'], defaultLang: 'en' }, preloadLangs: true }),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HintResultsComponent);
    component = fixture.componentInstance;
    component.presentations = presentations;
    component.summary = summary;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('marks each word correct or incorrect based on the selected response indices', () => {
    expect(component.wordResults(presentations[0])).toEqual(['N', 'Y', 'Y', 'Y']);
  });

  it('renders one row per presentation with SNR, score, result, and sentence', () => {
    const cells: NodeListOf<HTMLTableCellElement> = fixture.nativeElement.querySelectorAll('.results-table tbody tr td');
    expect(cells[0].textContent?.trim()).toBe('1');
    expect(cells[1].textContent?.trim()).toBe('-14');
    expect(cells[2].textContent?.trim()).toBe('3/4');
    expect(cells[3].textContent?.trim()).toBe('[N, Y, Y, Y]');
    expect(cells[4].textContent?.trim()).toBe('the big dog ran');
  });

  it('renders the SRT and exam-level details from the summary', () => {
    const element: HTMLElement = fixture.nativeElement;
    expect(element.querySelector('.hint-srt')?.textContent).toContain('-11.5');

    const detailCells = element.querySelectorAll('.details-table td');
    expect(detailCells[0].textContent?.trim()).toBe('Swahili Noise Right');
    expect(detailCells[1].textContent?.trim()).toBe(HintLanguage.Swahili);
    expect(detailCells[2].textContent?.trim()).toBe(HintDirection.Right);
    expect(detailCells[3].textContent?.trim()).toBe('word');
    expect(detailCells[4].textContent?.trim()).toBe('5');
  });
});
