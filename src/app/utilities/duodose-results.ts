import { DoseChannel, DoseMetric, DoseSessionRecord } from './duodose-log-parser';

/**
 * Table of results for one or more DuoDose sessions, in the shape stored on the results page.
 * `headers[i]` labels `sessions[n][i]` and `combined[i]`.
 */
export interface DoseResultsTable {
  headers: string[];
  sessions: string[][];
  combined: string[];
}

export const PEAK_HEADER = 'Peak Sounds Pressure Level (dBP)';
export const IMPULSES_HEADER = 'Number of Impulses';
export const DEVICE_HEADER = 'Device ID';
export const DURATION_HEADER = 'Duration';
export const START_HEADER = 'Start Time';
const FIXED_HEADERS = [PEAK_HEADER, IMPULSES_HEADER, DEVICE_HEADER, DURATION_HEADER, START_HEADER];

type CombineRule = (values: number[], durationsSec: number[]) => number;

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/** Energy sum of levels in dB: the total exposure of back-to-back sessions. */
export function combineLevelsTotal(levelsDb: number[]): number {
  const total = levelsDb.reduce((sum, level) => sum + 10 ** (level / 10), 0);
  return round2(10 * Math.log10(total));
}

/** Duration-weighted energy average of levels in dB. */
export function combineLevelsAverage(levelsDb: number[], durationsSec: number[]): number {
  const weighted = levelsDb.reduce((sum, level, i) => sum + 10 ** (level / 10) * durationsSec[i], 0);
  const totalDuration = durationsSec.reduce((sum, d) => sum + d, 0);
  return round2(10 * Math.log10(weighted / totalDuration));
}

/**
 * Rule for combining a metric across sessions, chosen from its label. Returns undefined when the metric
 * cannot be meaningfully combined (e.g. TWA, projected values, calibration checks).
 */
export function combineRuleForLabel(label: string): CombineRule | undefined {
  const lower = label.toLowerCase();
  if (lower.startsWith('projected')) return undefined;
  if (lower.endsWith('8hr')) return combineLevelsTotal;
  if (lower.endsWith('session')) return combineLevelsAverage;
  if (lower.includes('dose')) return values => round2(values.reduce((sum, v) => sum + v, 0));
  if (lower.endsWith('max')) return values => Math.max(...values);
  return undefined;
}

export function formatDuration(durationSec: number): string {
  const MINUTE = 60;
  const HOUR = MINUTE * 60;
  const DAY = HOUR * 24;
  const YEAR = DAY * 365;
  const thresholds = [
    { limit: MINUTE, divisor: 1, unit: 'sec' },
    { limit: HOUR, divisor: MINUTE, unit: 'min' },
    { limit: DAY, divisor: HOUR, unit: 'hours' },
    { limit: YEAR, divisor: DAY, unit: 'days' },
  ];
  const match = thresholds.find(({ limit }) => durationSec < limit);
  if (!match) return '';
  return `${Math.round((durationSec / match.divisor) * 10) / 10} ${match.unit}`;
}

export function formatStartTime(isoStart: string): string {
  return new Date(isoStart).toLocaleString('UTC', { timeZone: 'UTC' });
}

function formatValue(value: number | string | null | undefined): string {
  if (value === null || value === undefined) return '';
  return String(value);
}

/** Labels are shown as the old display did: commas replaced by spaces, e.g. `LAeq 8hr`. */
export function displayLabel(label: string): string {
  return label.replace(/,/g, ' ');
}

/**
 * The metric shown for a channel when the channel carries several. Prefers the 8-hour equivalent level
 * (`TWA` or `...8hr`, not a projected value), then the first metric with a value, then the first metric.
 */
export function primaryMetric(channel: DoseChannel): DoseMetric | undefined {
  const isEightHour = (m: DoseMetric) => {
    const lower = m.label.toLowerCase();
    return !lower.startsWith('projected') && (lower === 'twa' || lower.endsWith('8hr'));
  };
  return channel.metrics.find(isEightHour) ?? channel.metrics.find(m => m.value !== null) ?? channel.metrics[0];
}

interface DisplayMetric {
  /** Table header. Legacy channels use the metric label; grouped channels prefix the channel name. */
  header: string;
  /** Raw metric label, used to choose the combine rule. */
  label: string;
  value: number | string | null;
}

/**
 * One display row per channel, matching the original four-channel layout for both row formats.
 */
function displayMetrics(record: DoseSessionRecord): DisplayMetric[] {
  const rows: DisplayMetric[] = [];
  for (const channel of record.channels) {
    const metric = record.format === 'legacy' ? channel.metrics[0] : primaryMetric(channel);
    if (!metric) continue;
    const header = record.format === 'legacy' ? displayLabel(metric.label) : `${channel.name} ${displayLabel(metric.label)}`;
    rows.push({ header, label: metric.label, value: metric.value });
  }
  return rows;
}

/**
 * Build the results table for the given sessions: one row per channel (the union across sessions in
 * order of first appearance), followed by the fixed peak/impulse/device/duration/start rows.
 */
export function buildDoseResultsTable(records: DoseSessionRecord[], deviceName: string): DoseResultsTable {
  const metricHeaders: string[] = [];
  const labelsByHeader = new Map<string, string>();
  const perSessionMetrics = records.map(record => {
    const metrics = new Map<string, number | string | null>();
    for (const row of displayMetrics(record)) {
      if (!metricHeaders.includes(row.header)) {
        metricHeaders.push(row.header);
        labelsByHeader.set(row.header, row.label);
      }
      metrics.set(row.header, row.value);
    }
    return metrics;
  });

  const headers = [...metricHeaders, ...FIXED_HEADERS];
  const sessions = records.map((record, n) => [
    ...metricHeaders.map(header => formatValue(perSessionMetrics[n].get(header))),
    formatValue(record.peakLevel),
    formatValue(record.numImpulses),
    deviceName,
    formatValue(record.durationSec),
    formatStartTime(record.startTime),
  ]);

  const combined = records.length === 0 ? [] : combineRecords(records, metricHeaders, labelsByHeader, perSessionMetrics, deviceName);
  return { headers, sessions, combined };
}

function combineRecords(
  records: DoseSessionRecord[],
  metricHeaders: string[],
  labelsByHeader: Map<string, string>,
  perSessionMetrics: Map<string, number | string | null>[],
  deviceName: string
): string[] {
  const durations = records.map(r => r.durationSec);
  const totalDuration = durations.reduce((sum, d) => sum + d, 0);
  const single = records.length === 1;

  const combinedMetrics = metricHeaders.map(header => {
    const values = perSessionMetrics.map(m => m.get(header));
    if (single) return formatValue(values[0]);
    const numeric = values.map(v => (typeof v === 'number' ? v : null));
    if (numeric.includes(null)) return '';
    const rule = combineRuleForLabel(labelsByHeader.get(header) ?? header);
    return rule ? formatValue(rule(numeric as number[], durations)) : '';
  });

  const peaks = records.map(r => r.peakLevel).filter((p): p is number => p !== null);
  const impulses = records.map(r => r.numImpulses).filter((n): n is number => n !== null);
  const earliestStart = records.map(r => r.startTime).reduce((a, b) => (Date.parse(b) < Date.parse(a) ? b : a), records[0].startTime);

  return [
    ...combinedMetrics,
    peaks.length > 0 ? formatValue(Math.max(...peaks)) : '',
    impulses.length > 0 ? formatValue(impulses.reduce((sum, n) => sum + n, 0)) : '',
    deviceName,
    formatDuration(totalDuration),
    formatStartTime(earliestStart),
  ];
}
