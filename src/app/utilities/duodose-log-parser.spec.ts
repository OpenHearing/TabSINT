import { findSessionByStart, parseDuodoseLog, parseSessionRow, splitCsvLine } from './duodose-log-parser';

/** Anonymized excerpt of a real `<device>_Log.csv` mixing legacy, calibration-check and grouped rows. */
export const SAMPLE_LOG = [
  'Device Name:,"A0000001"',
  'Device UID:,00000000000000000000000000000000',
  '',
  'Session Name,Session UID,Session Note,Subject Name,Start DateTime,Duration (sec),Channel 1 Settings,Channel 1 Value,Channel 2 Settings,Channel 2 Value,Channel 3 Settings,Channel 3 Value,Channel 4 Settings,Channel 4 Value,Num Impulses,Peak Level (dB SPL)',
  '"CalCheck",F1BAC1AB,"","","2026-08-06T17:22:03.000Z",5.700,Channel 1 Check:,Not passed,Channel 2 Check:,Not passed,',
  '"CalCheck",8F82542E,"","","2026-08-06T17:27:58.000Z",29.400,Channel 1 Check:,Passed,Channel 2 Check:,Passed,',
  '"legacyTest",38F9D23F,"note, with comma","subj","2026-08-06T17:30:20.000Z",48.000,"LAeq,8hr", 56.4,"LAeq,session", 84.1,"LCeq,session", 89.6,"LZeq,session", 90.7,1,137.4',
  '"legacyTest",4DFB415E,"","","2026-09-08T14:45:13.000Z",93.025,"LAeq,8hr", 50.8,"LAeq,session", 75.7,"LCeq,session", 78.9,"LZeq,session", 79.5,0,125.6',
  '"groupedTest",E2D221BF,"","","2026-09-18T17:51:15.000Z",14.850,"OSHA PEL","L_OSHA,60s,max",nan,"TWA",20.93,"Projected TWA",75.54,"Dose %",0.006947,"OSHA AL","L_OSHA,60s,max",nan,"TWA",28.95,"Projected TWA",83.56,"Dose %",0.04223,"NIOSH REL","LAeq,60s,max",nan,"LAeq,8hr",53.55,"Projected LAeq,8hr",86.43,"Dose %",0.07159,"Freq_A_CL_85dBA_ER_3dB","LAeq,60s,max",nan,"LAeq,8hr",53.60,"Projected LAeq,8hr",86.48,"Dose %",0.07246,"Num Impulses",0,"Peak Level (dB SPL)",131.2',
].join('\n');

describe('splitCsvLine', () => {
  it('splits plain cells and trims whitespace', () => {
    expect(splitCsvLine('a, b ,c')).toEqual(['a', 'b', 'c']);
  });

  it('keeps commas inside quoted cells', () => {
    expect(splitCsvLine('"L_OSHA,60s,max",nan,"TWA",20.93')).toEqual(['L_OSHA,60s,max', 'nan', 'TWA', '20.93']);
  });

  it('unescapes doubled quotes and preserves empty cells', () => {
    expect(splitCsvLine('"say ""hi""",,x,')).toEqual(['say "hi"', '', 'x', '']);
  });
});

describe('parseDuodoseLog', () => {
  const log = parseDuodoseLog(SAMPLE_LOG);

  it('reads the preamble', () => {
    expect(log.deviceName).toBe('A0000001');
    expect(log.deviceUid).toBe('00000000000000000000000000000000');
  });

  it('parses every session row and skips the header', () => {
    expect(log.sessions.length).toBe(5);
    expect(log.sessions.map(s => s.sessionName)).toEqual(['CalCheck', 'CalCheck', 'legacyTest', 'legacyTest', 'groupedTest']);
  });

  it('parses legacy rows into one metric per channel with trailing impulses and peak', () => {
    const legacy = log.sessions[2];
    expect(legacy.format).toBe('legacy');
    expect(legacy.note).toBe('note, with comma');
    expect(legacy.durationSec).toBe(48);
    expect(legacy.channels.map(c => c.name)).toEqual(['Channel 1', 'Channel 2', 'Channel 3', 'Channel 4']);
    expect(legacy.channels.map(c => c.metrics[0].label)).toEqual(['LAeq,8hr', 'LAeq,session', 'LCeq,session', 'LZeq,session']);
    expect(legacy.channels.map(c => c.metrics[0].value)).toEqual([56.4, 84.1, 89.6, 90.7]);
    expect(legacy.numImpulses).toBe(1);
    expect(legacy.peakLevel).toBe(137.4);
  });

  it('parses calibration check rows with pass/fail values and no impulses or peak', () => {
    const check = log.sessions[1];
    expect(check.format).toBe('legacy');
    expect(check.channels.length).toBe(2);
    expect(check.channels[0].metrics[0]).toEqual({ label: 'Channel 1 Check:', value: 'Passed' });
    expect(check.numImpulses).toBeNull();
    expect(check.peakLevel).toBeNull();
  });

  it('parses grouped rows into named channels with several metrics each', () => {
    const grouped = log.sessions[4];
    expect(grouped.format).toBe('grouped');
    expect(grouped.channels.map(c => c.name)).toEqual(['OSHA PEL', 'OSHA AL', 'NIOSH REL', 'Freq_A_CL_85dBA_ER_3dB']);
    expect(grouped.channels[0].metrics).toEqual([
      { label: 'L_OSHA,60s,max', value: null },
      { label: 'TWA', value: 20.93 },
      { label: 'Projected TWA', value: 75.54 },
      { label: 'Dose %', value: 0.006947 },
    ]);
    expect(grouped.channels[2].metrics[1]).toEqual({ label: 'LAeq,8hr', value: 53.55 });
    expect(grouped.numImpulses).toBe(0);
    expect(grouped.peakLevel).toBe(131.2);
  });

  it('tolerates Windows line endings and a missing preamble', () => {
    const minimal = parseDuodoseLog(['Session Name,x', '"s",U,"","","2026-01-01T00:00:00.000Z",1,"LAeq,8hr",50,0,100'].join('\r\n'));
    expect(minimal.deviceName).toBeUndefined();
    expect(minimal.sessions.length).toBe(1);
    expect(minimal.sessions[0].peakLevel).toBe(100);
  });
});

describe('parseSessionRow', () => {
  it('rejects rows without a valid start time', () => {
    expect(parseSessionRow(['a', 'b', 'c', 'd', 'not a date', '1'])).toBeUndefined();
    expect(parseSessionRow(['too', 'short'])).toBeUndefined();
  });
});

describe('findSessionByStart', () => {
  it('matches the session folder timestamp to the row start time', () => {
    const log = parseDuodoseLog(SAMPLE_LOG);
    const found = findSessionByStart(log, new Date(Date.UTC(2026, 8, 18, 17, 51, 15)));
    expect(found?.sessionUid).toBe('E2D221BF');
    expect(findSessionByStart(log, new Date(0))).toBeUndefined();
  });
});
