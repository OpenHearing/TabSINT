import { NormativeDataInterface } from '../../../../../interfaces/normative-data-interface';
import { CommonResponseAreaInterface } from '../../../../../interfaces/page-definition.interface';
import { DpoaeSeriesStyle, LegendItemInterface } from '../../../../../utilities/d3-plot-functions';
import { DPOAEAudioChannel } from '../../dp-gram/dp-gram-exam/dp-gram-exam.interface';

/** Fixed Y-axis domain (dB) shared by every DPOAE-family plot (in-progress and results, DP-gram and Swept DPOAE). */
export const DPOAE_Y_AXIS_DOMAIN: [number, number] = [-40, 100];

/** Line/marker style for each DPOAE-family series, shared by every DPOAE plot (in-progress and results, DP-gram and Swept DPOAE). */
export const DPOAE_SERIES_STYLE: Record<'F1' | 'F2' | 'DpLow' | 'NoiseFloor', Omit<DpoaeSeriesStyle, 'yClampMin' | 'yClampMax'>> = {
  F1: { color: '#9400d3', marker: 'dot' },
  F2: { color: '#ff9800', marker: 'dot' },
  DpLow: { color: 'blue', marker: 'circle' },
  NoiseFloor: { color: 'gray', marker: 'X' },
};

/** Legend entries matching DPOAE_SERIES_STYLE, in on-screen order. */
export const DPOAE_LEGEND_DATA: LegendItemInterface[] = [
  { label: 'F1', color: DPOAE_SERIES_STYLE.F1.color, symbol: DPOAE_SERIES_STYLE.F1.marker, line: 'solid' },
  { label: 'F2', color: DPOAE_SERIES_STYLE.F2.color, symbol: DPOAE_SERIES_STYLE.F2.marker, line: 'solid' },
  { label: 'DPlow', color: DPOAE_SERIES_STYLE.DpLow.color, symbol: DPOAE_SERIES_STYLE.DpLow.marker, line: 'solid' },
  { label: 'NFlow', color: DPOAE_SERIES_STYLE.NoiseFloor.color, symbol: DPOAE_SERIES_STYLE.NoiseFloor.marker, line: 'solid' },
];

/**
 * Per-ear override for DPOAE-family plot styling (DP-gram only, currently), applied to just the
 * DpLow series (the actual DP-gram trace): left is blue with an X marker, right is red with a
 * circle (o) marker.
 */
const EAR_OVERRIDE_STYLE: Record<DPOAEAudioChannel, Omit<DpoaeSeriesStyle, 'yClampMin' | 'yClampMax'>> = {
  left: { color: 'blue', marker: 'X' },
  right: { color: 'red', marker: 'circle' },
};

/** Resolves per-series plot style for a DPOAE-family plot, applying the ear override (DpLow only) when set. */
export function getDpoaeSeriesStyle(ear?: DPOAEAudioChannel): typeof DPOAE_SERIES_STYLE {
  if (!ear) return DPOAE_SERIES_STYLE;
  return { ...DPOAE_SERIES_STYLE, DpLow: EAR_OVERRIDE_STYLE[ear] };
}

/** Resolves legend entries for a DPOAE-family plot, applying the ear override when set. */
export function getDpoaeLegendData(ear?: DPOAEAudioChannel): LegendItemInterface[] {
  const style = getDpoaeSeriesStyle(ear);
  return [
    { label: 'F1', color: style.F1.color, symbol: style.F1.marker, line: 'solid' },
    { label: 'F2', color: style.F2.color, symbol: style.F2.marker, line: 'solid' },
    { label: 'DPlow', color: style.DpLow.color, symbol: style.DpLow.marker, line: 'solid' },
    { label: 'NFlow', color: style.NoiseFloor.color, symbol: style.NoiseFloor.marker, line: 'solid' },
  ];
}

export interface DpoaeCommonInterface extends CommonResponseAreaInterface {
  exportToCSV?: boolean;
  tabsintId?: string;
  outputCalibrationType?: string;
  outputChannel1?: string;
  outputChannel2?: string;
  inputChannel?: string;
  ratio?: number;
  l1?: number;
  l2?: number;
  noiseFloorThreshold?: number;
  SNRThreshold?: number;
  recordFileFolder?: string;
  outputRawMeasurements?: boolean;
  showResults?: boolean;
  normativeDataPath?: string;
  normativeData?: NormativeDataInterface[];
  autoSubmit?: boolean;
}

export interface DpoaeResultsCommonInterface {
  State: string;
  PctComplete: number;
}

export interface DPOAEDataInterface {
  Frequency: number[];
  Amplitude: number[];
  Phase: number[];
  NoiseFloor?: number[];
}
