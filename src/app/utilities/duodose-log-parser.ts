/**
 * Parser for the DuoDose `<device>_Log.csv` session log.
 *
 * The log has a short preamble (device name and UID), a blank line, a header row and then one row per
 * session. The header row has not changed across firmware versions but the row layout has, so rows are
 * parsed by structure rather than by header position. Three row shapes are supported and may coexist in
 * one file:
 *
 * - legacy dosimetry: six fixed columns, then four `<metric label>,<value>` pairs, then bare
 *   `<num impulses>,<peak level>` columns.
 * - calibration check: six fixed columns, then `<label>,<Passed|Not passed>` pairs and a trailing empty cell.
 * - grouped dosimetry (newer firmware): six fixed columns, then repeated `<channel name>` followed by
 *   `<metric label>,<value>` pairs, ending with labelled `Num Impulses` and `Peak Level` pairs.
 */

export type DoseRowFormat = 'legacy' | 'grouped';

export interface DoseMetric {
  /** Metric label as written by the device, e.g. `LAeq,8hr` or `Dose %`. */
  label: string;
  /** Numeric value, a pass/fail style string, or null when the device wrote `nan` or nothing. */
  value: number | string | null;
}

export interface DoseChannel {
  /** Channel name. Legacy rows use `Channel N`; grouped rows use the criterion name, e.g. `OSHA PEL`. */
  name: string;
  metrics: DoseMetric[];
}

export interface DoseSessionRecord {
  sessionName: string;
  sessionUid: string;
  note: string;
  subject: string;
  /** ISO-8601 start time as written by the device. */
  startTime: string;
  durationSec: number;
  channels: DoseChannel[];
  numImpulses: number | null;
  peakLevel: number | null;
  format: DoseRowFormat;
}

export interface DuodoseLog {
  deviceName?: string;
  deviceUid?: string;
  sessions: DoseSessionRecord[];
}

const HEADER_PREFIX = 'Session Name';
const FIXED_COLUMN_COUNT = 6;
const PASS_FAIL_RE = /^(passed|not passed)$/i;
const IMPULSES_LABEL_RE = /^num impulses$/i;
const PEAK_LABEL_RE = /^peak level/i;

/**
 * Split one CSV line into trimmed cells, honouring RFC 4180 quoting (commas and doubled quotes inside quotes).
 */
export function splitCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = '';
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (quoted) {
      if (char === '"') {
        if (line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          quoted = false;
        }
      } else {
        current += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === ',') {
      cells.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  cells.push(current.trim());
  return cells;
}

function isNumericCell(cell: string | undefined): boolean {
  return cell !== undefined && cell !== '' && (cell.toLowerCase() === 'nan' || !Number.isNaN(Number(cell)));
}

function isValueCell(cell: string | undefined): boolean {
  return cell !== undefined && (isNumericCell(cell) || PASS_FAIL_RE.test(cell));
}

function toMetricValue(cell: string): number | string | null {
  if (cell === '' || cell.toLowerCase() === 'nan') return null;
  const asNumber = Number(cell);
  return Number.isNaN(asNumber) ? cell : asNumber;
}

function toNumberOrNull(cell: string | undefined): number | null {
  if (cell === undefined) return null;
  const value = toMetricValue(cell);
  return typeof value === 'number' ? value : null;
}

/**
 * Parse the variable-length tail of a session row into channels, impulses and peak level.
 */
function parseRowTail(tail: string[]): Pick<DoseSessionRecord, 'channels' | 'numImpulses' | 'peakLevel' | 'format'> {
  const cells = [...tail];
  while (cells.length > 0 && cells.at(-1) === '') cells.pop();

  // Legacy rows start straight in with a metric label followed by its value.
  const format: DoseRowFormat = cells.length > 0 && !isNumericCell(cells[0]) && isValueCell(cells[1]) ? 'legacy' : 'grouped';

  const channels: DoseChannel[] = [];
  let current: DoseChannel | undefined;
  let numImpulses: number | null = null;
  let peakLevel: number | null = null;
  const bareNumbers: string[] = [];

  let i = 0;
  while (i < cells.length) {
    const label = cells[i];
    const next = cells[i + 1];
    if (!isNumericCell(label) && isValueCell(next)) {
      const metric: DoseMetric = { label, value: toMetricValue(next) };
      if (IMPULSES_LABEL_RE.test(label)) {
        numImpulses = toNumberOrNull(next);
      } else if (PEAK_LABEL_RE.test(label)) {
        peakLevel = toNumberOrNull(next);
      } else if (format === 'legacy') {
        channels.push({ name: `Channel ${channels.length + 1}`, metrics: [metric] });
      } else {
        if (!current) {
          current = { name: `Channel ${channels.length + 1}`, metrics: [] };
          channels.push(current);
        }
        current.metrics.push(metric);
      }
      i += 2;
    } else if (isNumericCell(label)) {
      bareNumbers.push(label);
      i += 1;
    } else {
      current = { name: label, metrics: [] };
      channels.push(current);
      i += 1;
    }
  }

  // Legacy rows end with unlabelled `<num impulses>,<peak level>` columns.
  if (bareNumbers.length >= 1 && numImpulses === null) numImpulses = toNumberOrNull(bareNumbers[0]);
  if (bareNumbers.length >= 2 && peakLevel === null) peakLevel = toNumberOrNull(bareNumbers[1]);

  return { channels, numImpulses, peakLevel, format };
}

/**
 * Parse one session row. Returns undefined for rows that do not carry a valid start time.
 */
export function parseSessionRow(cells: string[]): DoseSessionRecord | undefined {
  if (cells.length < FIXED_COLUMN_COUNT) return undefined;
  const [sessionName, sessionUid, note, subject, startTime, duration] = cells;
  if (Number.isNaN(Date.parse(startTime))) return undefined;
  return {
    sessionName,
    sessionUid,
    note,
    subject,
    startTime,
    durationSec: Number(duration) || 0,
    ...parseRowTail(cells.slice(FIXED_COLUMN_COUNT)),
  };
}

/**
 * Parse the full contents of a DuoDose session log.
 */
export function parseDuodoseLog(text: string): DuodoseLog {
  const lines = text.split(/\r?\n/);
  const headerIndex = lines.findIndex(line => line.startsWith(HEADER_PREFIX));
  const log: DuodoseLog = { sessions: [] };

  for (const line of lines.slice(0, Math.max(headerIndex, 0))) {
    const [key, value] = splitCsvLine(line);
    const normalizedKey = key?.replace(/:$/, '').trim().toLowerCase();
    if (normalizedKey === 'device name') log.deviceName = value;
    if (normalizedKey === 'device uid') log.deviceUid = value;
  }

  for (const line of lines.slice(headerIndex + 1)) {
    if (line.trim() === '') continue;
    const record = parseSessionRow(splitCsvLine(line));
    if (record) log.sessions.push(record);
  }
  return log;
}

/**
 * Find the session whose start time matches the given instant.
 */
export function findSessionByStart(log: DuodoseLog, start: Date): DoseSessionRecord | undefined {
  const target = start.getTime();
  return log.sessions.find(session => Date.parse(session.startTime) === target);
}
