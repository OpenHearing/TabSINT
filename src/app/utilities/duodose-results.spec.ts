import { parseDuodoseLog } from './duodose-log-parser';
import { SAMPLE_LOG } from './duodose-log-parser.spec';
import {
  buildDoseResultsTable,
  combineLevelsAverage,
  combineLevelsTotal,
  combineRuleForLabel,
  displayLabel,
  formatDuration,
  primaryMetric,
} from './duodose-results';

describe('duodose results combination rules', () => {
  it('energy-sums 8hr levels', () => {
    expect(combineLevelsTotal([80, 80])).toBeCloseTo(83.01, 2);
    expect(combineRuleForLabel('LAeq,8hr')).toBe(combineLevelsTotal);
  });

  it('duration-weights session levels', () => {
    expect(combineLevelsAverage([80, 90], [10, 10])).toBeCloseTo(87.4, 1);
    expect(combineRuleForLabel('LCeq,session')).toBe(combineLevelsAverage);
  });

  it('sums doses, takes max of maxima, and refuses projected/TWA/check metrics', () => {
    expect(combineRuleForLabel('Dose %')!([0.5, 0.25], [1, 1])).toBe(0.75);
    expect(combineRuleForLabel('LAeq,60s,max')!([70, 75], [1, 1])).toBe(75);
    expect(combineRuleForLabel('Projected LAeq,8hr')).toBeUndefined();
    expect(combineRuleForLabel('TWA')).toBeUndefined();
    expect(combineRuleForLabel('Channel 1 Check:')).toBeUndefined();
  });

  it('displays labels with spaces in place of commas, as the original display did', () => {
    expect(displayLabel('LAeq,8hr')).toBe('LAeq 8hr');
    expect(displayLabel('L_OSHA,60s,max')).toBe('L_OSHA 60s max');
  });

  it("picks the 8-hour equivalent metric as a grouped channel's primary value", () => {
    expect(
      primaryMetric({
        name: 'OSHA PEL',
        metrics: [
          { label: 'L_OSHA,60s,max', value: null },
          { label: 'TWA', value: 20.9 },
          { label: 'Projected TWA', value: 75 },
        ],
      })?.label
    ).toBe('TWA');
    expect(
      primaryMetric({
        name: 'NIOSH REL',
        metrics: [
          { label: 'LAeq,60s,max', value: 70 },
          { label: 'Projected LAeq,8hr', value: 86 },
          { label: 'LAeq,8hr', value: 53 },
        ],
      })?.label
    ).toBe('LAeq,8hr');
    expect(
      primaryMetric({
        name: 'x',
        metrics: [
          { label: 'a', value: null },
          { label: 'b', value: 1 },
        ],
      })?.label
    ).toBe('b');
  });

  it('formats durations', () => {
    expect(formatDuration(48)).toBe('48 sec');
    expect(formatDuration(141)).toBe('2.4 min');
    expect(formatDuration(7200)).toBe('2 hours');
  });
});

describe('buildDoseResultsTable', () => {
  const log = parseDuodoseLog(SAMPLE_LOG);
  const [check, , legacyA, legacyB, grouped] = log.sessions;

  it('renders a single legacy session with the same headers as before', () => {
    const table = buildDoseResultsTable([legacyA], 'A0000001');
    expect(table.headers).toEqual([
      'LAeq 8hr',
      'LAeq session',
      'LCeq session',
      'LZeq session',
      'Peak Sounds Pressure Level (dBP)',
      'Number of Impulses',
      'Device ID',
      'Duration',
      'Start Time',
    ]);
    expect(table.sessions[0].slice(0, 7)).toEqual(['56.4', '84.1', '89.6', '90.7', '137.4', '1', 'A0000001']);
    expect(table.combined.slice(0, 8)).toEqual(['56.4', '84.1', '89.6', '90.7', '137.4', '1', 'A0000001', '48 sec']);
  });

  it('combines two legacy sessions', () => {
    const table = buildDoseResultsTable([legacyA, legacyB], 'A0000001');
    expect(table.sessions.length).toBe(2);
    expect(Number(table.combined[0])).toBeCloseTo(57.46, 2); // energy sum of 56.4 and 50.8
    expect(table.combined[4]).toBe('137.4'); // max peak
    expect(table.combined[5]).toBe('1'); // impulses summed
    expect(table.combined[7]).toBe('2.4 min'); // 48 + 93.025 s
    expect(table.combined[8]).toContain('2026'); // earliest start
  });

  it('renders grouped sessions in the same nine-row layout with one primary metric per channel', () => {
    const table = buildDoseResultsTable([grouped], 'A0000001');
    expect(table.headers).toEqual([
      'OSHA PEL TWA',
      'OSHA AL TWA',
      'NIOSH REL LAeq 8hr',
      'Freq_A_CL_85dBA_ER_3dB LAeq 8hr',
      'Peak Sounds Pressure Level (dBP)',
      'Number of Impulses',
      'Device ID',
      'Duration',
      'Start Time',
    ]);
    expect(table.sessions[0].slice(0, 6)).toEqual(['20.93', '28.95', '53.55', '53.6', '131.2', '0']);
    expect(table.combined.slice(0, 4)).toEqual(['20.93', '28.95', '53.55', '53.6']); // single session passes through
  });

  it('combines two grouped sessions per channel rule and leaves TWA blank', () => {
    const table = buildDoseResultsTable([grouped, grouped], 'A0000001');
    expect(table.combined[0]).toBe(''); // TWA is not combinable
    expect(Number(table.combined[2])).toBeCloseTo(56.56, 2); // LAeq,8hr energy sum of 53.55 twice
    expect(table.combined[4]).toBe('131.2');
  });

  it('leaves non-shared metrics blank when mixing formats', () => {
    const table = buildDoseResultsTable([legacyA, grouped], 'A0000001');
    expect(table.headers).toContain('LAeq 8hr');
    expect(table.headers).toContain('OSHA PEL TWA');
    expect(table.combined[table.headers.indexOf('LAeq 8hr')]).toBe('');
    expect(table.combined[table.headers.indexOf('OSHA PEL TWA')]).toBe('');
    expect(table.combined[table.headers.indexOf('Peak Sounds Pressure Level (dBP)')]).toBe('137.4');
  });

  it('renders calibration checks as text and does not combine them', () => {
    const table = buildDoseResultsTable([check], 'A0000001');
    expect(table.headers[0]).toBe('Channel 1 Check:');
    expect(table.sessions[0][0]).toBe('Not passed');
    expect(table.sessions[0][table.headers.indexOf('Peak Sounds Pressure Level (dBP)')]).toBe('');
  });

  it('returns empty combined for no records', () => {
    expect(buildDoseResultsTable([], 'x').combined).toEqual([]);
  });
});
