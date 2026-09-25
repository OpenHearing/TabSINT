import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslocoTestingModule } from '@jsverse/transloco';

import { ManualAudiometryResultViewerComponent } from './manual-audiometry-result-viewer';
import { ExamService } from '../../../../../controllers/exam.service';
import { PageModel } from '../../../../../models/page/page.service';
import { ResultsModel } from '../../../../../models/results/results-model.service';
import { PageInterface } from '../../../../../models/page/page.interface';
import { AudiometryResultsInterface, EarChannel } from '../../../../../interfaces/audiometry-results.interface';

describe('ManualAudiometryResultViewerComponent', () => {
  let component: ManualAudiometryResultViewerComponent;
  let fixture: ComponentFixture<ManualAudiometryResultViewerComponent>;
  let examService: jasmine.SpyObj<ExamService>;
  let pageModel: PageModel;
  let resultsModel: ResultsModel;

  beforeEach(async () => {
    examService = jasmine.createSpyObj<ExamService>('ExamService', ['submitDefault']);

    await TestBed.configureTestingModule({
      declarations: [ManualAudiometryResultViewerComponent],
      imports: [
        TranslocoTestingModule.forRoot({ langs: { en: {} }, translocoConfig: { availableLangs: ['en'], defaultLang: 'en' }, preloadLangs: true }),
      ],
      providers: [{ provide: ExamService, useValue: examService }],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(ManualAudiometryResultViewerComponent);
    component = fixture.componentInstance;
    pageModel = TestBed.inject(PageModel);
    resultsModel = TestBed.inject(ResultsModel);
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('calls examService.submitDefault when the results are submitted', () => {
    fixture.detectChanges();
    component.submitResults();
    expect(examService.submitDefault).toHaveBeenCalled();
  });

  it('leaves an @Input-bound audiogramData untouched even if the current page does not match (the live in-exam case)', () => {
    const liveData: AudiometryResultsInterface = {
      frequencies: [1000],
      thresholds: [20],
      channels: [EarChannel.Left],
      resultTypes: ['Threshold'],
      masking: [false],
      levelUnits: 'dB HL',
    };
    component.audiogramData = liveData;
    fixture.detectChanges();

    pageModel.updatePage({ responseArea: { type: 'manualAudiometryResponseArea' } } as PageInterface);

    expect(component.audiogramData).toBe(liveData);
  });

  it('builds combined audiogramData from stored responses when used standalone', () => {
    resultsModel.getResults().currentExam.responses = [
      {
        pageId: 'a',
        page: {},
        response: {
          frequencies: [1000],
          thresholds: [20],
          channels: [EarChannel.Left],
          resultTypes: ['Threshold'],
          masking: [false],
          levelUnits: 'dB HL',
        },
      },
      {
        pageId: 'b',
        page: {},
        response: {
          frequencies: [2000],
          thresholds: [30],
          channels: [EarChannel.Right],
          resultTypes: ['Threshold'],
          masking: [false],
          levelUnits: 'dB HL',
        },
      },
      { pageId: 'c', page: {}, response: 'ignored, not part of pageIdsToDisplay' },
    ];

    fixture.detectChanges();
    pageModel.updatePage({
      responseArea: { type: 'manualAudiometryResultViewerResponseArea', pageIdsToDisplay: ['a', 'b'] },
    } as PageInterface);

    expect(component.audiogramData).toEqual({
      frequencies: [1000, 2000],
      thresholds: [20, 30],
      channels: [EarChannel.Left, EarChannel.Right],
      resultTypes: ['Threshold', 'Threshold'],
      masking: [false, false],
      levelUnits: 'dB HL',
    });
  });

  it('ignores page updates for other response-area types when standalone', () => {
    fixture.detectChanges();
    pageModel.updatePage({ responseArea: { type: 'textboxResponseArea' } } as PageInterface);
    expect(component.audiogramData).toBeUndefined();
  });
});
