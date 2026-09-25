import { AudiometryResultViewerComponent } from './audiometry-result-viewer.component';
import { CurrentResults } from '../../../../../models/results/results.interface';
import { AudiometryOutputChannel } from '../../shared/audiometry/audiometry.interface';
import { EarChannel } from '../../../../../interfaces/audiometry-results.interface';

describe('AudiometryResultViewerComponent', () => {
  let component: AudiometryResultViewerComponent;

  beforeEach(() => {
    component = new AudiometryResultViewerComponent();
  });

  it('builds a one-point combined audiogram for a stored Hughson-Westlake result', () => {
    component.result = {
      pageId: 'hw_1',
      responseArea: 'hughsonWestlakeResponseArea',
      response: { RetSPL: 0, L: [30, 20], FalsePositive: [], ResponseTime: [], NumCorrectResp: 2, Threshold: 20, Units: 0, ResultType: 'Threshold' },
      page: { responseArea: { type: 'hughsonWestlakeResponseArea', examProperties: { F: 1000, OutputChannel: AudiometryOutputChannel.HPR0 } } },
    } as unknown as CurrentResults;

    expect(component.dataStruct).toEqual({
      frequencies: [1000],
      thresholds: [20],
      channels: [EarChannel.Right],
      resultTypes: ['Threshold'],
      masking: [false],
      levelUnits: 'dB HL',
    });
  });

  it('builds a one-point combined audiogram for a stored BHAFT result, always in dB SPL', () => {
    component.result = {
      pageId: 'bhaft_1',
      responseArea: 'bhaftResponseArea',
      response: { ThresholdFrequency: 4000, ThresholdLevel: 40, F: [], L: [], ResultType: 'Threshold' },
      page: { responseArea: { type: 'bhaftResponseArea', examProperties: { OutputChannel: AudiometryOutputChannel.HPL0 } } },
    } as unknown as CurrentResults;

    expect(component.dataStruct).toEqual({
      frequencies: [4000],
      thresholds: [40],
      channels: [EarChannel.Left],
      resultTypes: ['Threshold'],
      masking: [false],
      levelUnits: 'dB SPL',
    });
  });

  it('returns an empty combined audiogram for an unrecognized responseArea', () => {
    component.result = { pageId: 'x', responseArea: 'somethingElse', response: {}, page: {} } as unknown as CurrentResults;

    expect(component.dataStruct).toEqual({
      frequencies: [],
      thresholds: [],
      channels: [],
      resultTypes: [],
      masking: [],
      levelUnits: '',
    });
  });
});
