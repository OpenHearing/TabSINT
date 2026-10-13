/** Per-point marker style for a trial-progression plot. */
export type TrialPointStyle = 'filled' | 'open' | 'highlight';

/** Marker shape used for every point in a trial-progression plot. Defaults to 'circle'. */
export type TrialPointShape = 'circle' | 'diamond';

/**
 * Data structure consumed by the shared trial-progression d3 plot: one point per trial/
 * presentation (value on the y axis, trial index on the x axis), optionally connected by a
 * line and with per-point styling (e.g. response received/not received/threshold-confirming).
 */
export interface TrialProgressionPlotDataInterface {
  y: number[];
  pointStyles?: TrialPointStyle[];
  pointShape?: TrialPointShape;
  connectLine?: boolean;
  maxY?: number;
  minX?: number;
  referenceLine?: number;
  referenceLineColor?: string;
  xLabel: string;
  yLabel: string;
  title: string;
}
