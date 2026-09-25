import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResponseResultComponent } from './response-result.component';
import { CurrentResults } from '../../../../../models/results/results.interface';

describe('ResponseResultComponent', () => {
  let component: ResponseResultComponent;
  let fixture: ComponentFixture<ResponseResultComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ResponseResultComponent],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(ResponseResultComponent);
    component = fixture.componentInstance;
  });

  function setResult(result: Partial<CurrentResults>) {
    component.result = result as CurrentResults;
    fixture.detectChanges();
  }

  it('dispatches threeDigitResponseArea to app-three-digit-results', () => {
    setResult({ responseArea: 'threeDigitResponseArea', response: { presentations: [] }, page: {} });
    expect(fixture.nativeElement.querySelector('app-three-digit-results')).toBeTruthy();
  });

  it('grades the raw trial list before dispatching mrtResponseArea to app-mrt-results', () => {
    setResult({
      responseArea: 'mrtResponseArea',
      response: [
        { SNR: -5, isCorrect: true },
        { SNR: -5, isCorrect: false },
      ],
      page: {},
    });
    expect(fixture.nativeElement.querySelector('app-mrt-results')).toBeTruthy();
    expect(component.mrtResults).toEqual([{ snr: -5, nbTrials: 2, nbTrialsCorrect: 1, pctCorrect: 50, trialList: jasmine.any(Array) }]);
  });

  it('dispatches hintResponseArea to app-hint-results and omits the summary when incomplete', () => {
    setResult({ responseArea: 'hintResponseArea', response: { presentations: [] }, page: {} });
    expect(fixture.nativeElement.querySelector('app-hint-results')).toBeTruthy();
    expect(component.hintSummary).toBeUndefined();
  });

  it('dispatches the audiometry family to app-audiometry-result-viewer', () => {
    setResult({ responseArea: 'bhaftResponseArea', response: {}, page: {} });
    expect(fixture.nativeElement.querySelector('app-audiometry-result-viewer')).toBeTruthy();
  });

  it('dispatches gapResponseArea to app-gap-results', () => {
    setResult({ responseArea: 'gapResponseArea', response: {}, page: {} });
    expect(fixture.nativeElement.querySelector('app-gap-results')).toBeTruthy();
  });

  it('falls back to the generic viewer for a responseArea with no dedicated viewer', () => {
    setResult({ responseArea: 'likertResponseArea', response: [1, 2, 3], page: {} });
    expect(fixture.nativeElement.querySelector('app-generic-result-viewer')).toBeTruthy();
  });
});
