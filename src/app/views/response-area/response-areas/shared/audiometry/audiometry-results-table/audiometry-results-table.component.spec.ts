import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { AudiometryResultsInterface } from '../../../../../../interfaces/audiometry-results.interface';
import { ResultType } from '../../../../../../utilities/constants';
import { AudiometryLegendComponent } from '../audiometry-legend/audiometry-legend.component';
import { AudiometryResultsTableComponent } from './audiometry-results-table.component';

describe('AudiometryResultsTableComponent', () => {
  let component: AudiometryResultsTableComponent;
  let fixture: ComponentFixture<AudiometryResultsTableComponent>;

  const dataStruct: AudiometryResultsInterface = {
    frequencies: [1000, 500, 2000],
    thresholds: [20, 15, null],
    channels: ['left', 'left', 'right'],
    resultTypes: [ResultType.Threshold, ResultType.Threshold, ResultType.Threshold],
    masking: [false, false, false],
    levelUnits: 'dB HL',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AudiometryResultsTableComponent, AudiometryLegendComponent],
      imports: [
        TranslocoTestingModule.forRoot({ langs: { en: {} }, translocoConfig: { availableLangs: ['en'], defaultLang: 'en' }, preloadLangs: true }),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AudiometryResultsTableComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('groups and sorts rows by channel on input change', () => {
    component.dataStruct = dataStruct;
    component.ngOnChanges();

    expect(component.channelGroups.length).toBe(2);
    const left = component.channelGroups.find(group => group.channel === 'left');
    expect(left?.rows.map(row => row.frequency)).toEqual([500, 1000]);
  });

  it('formats a missing threshold as "-"', () => {
    expect(component.formatThreshold(null, ResultType.Threshold)).toBe('-');
  });

  it('wraps "Hearing Potentially Better" thresholds in parentheses', () => {
    expect(component.formatThreshold(10, ResultType.Better)).toBe('(10)');
  });

  it('appends a "+" for "Hearing Potentially Beyond" thresholds', () => {
    expect(component.formatThreshold(110, ResultType.Beyond)).toBe('(110+)');
  });

  it('returns the plain value for a standard threshold', () => {
    expect(component.formatThreshold(25, ResultType.Threshold)).toBe('25');
  });

  describe('formatChannelName', () => {
    it('capitalizes the first letter of a channel', () => {
      expect(component.formatChannelName('left')).toBe('Left');
      expect(component.formatChannelName('right')).toBe('Right');
    });

    it('returns an empty string unchanged', () => {
      expect(component.formatChannelName('')).toBe('');
    });
  });

  describe('groupResultsByChannel', () => {
    it('returns an empty array when there is no data', () => {
      expect(component.groupResultsByChannel(undefined)).toEqual([]);
    });

    it('groups rows by channel and sorts each group by frequency', () => {
      const dataStruct: AudiometryResultsInterface = {
        frequencies: [2000, 500, 1000],
        thresholds: [30, 20, 25],
        channels: ['left', 'left', 'right'],
        resultTypes: [ResultType.Threshold, ResultType.Threshold, ResultType.Threshold],
        masking: [false, false, true],
        levelUnits: 'dB HL',
      };

      const groups = component.groupResultsByChannel(dataStruct);

      expect(groups.length).toBe(2);

      const left = groups.find(group => group.channel === 'left');
      expect(left?.rows.map(row => row.frequency)).toEqual([500, 2000]);
      expect(left?.hasMasking).toBe(false);

      const right = groups.find(group => group.channel === 'right');
      expect(right?.rows.map(row => row.frequency)).toEqual([1000]);
      expect(right?.hasMasking).toBe(true);
    });
  });
});
