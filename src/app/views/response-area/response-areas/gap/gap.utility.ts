import { GapResultsInterface } from './gap.interface';
import { TrialProgressionPlotDataInterface } from '../shared/trial-progression-plot/trial-progression-plot.interface';

/**
 * Build the data consumed by the shared trial-progression plot: gap length per presentation,
 * with the reversals used for the threshold highlighted and the threshold as a reference line.
 * @param results The gap exam results.
 */
export function buildGapProgressionData(results: GapResultsInterface): TrialProgressionPlotDataInterface {
  const gapLengths = results.GapLengthArray ?? [];
  const reversals = results.ReversalUsedForThresholdArray ?? [];
  const maxLength = gapLengths.reduce((max, value) => Math.max(value, max), 0);
  const gapThreshold = results.GapThreshold && !Number.isNaN(results.GapThreshold) ? results.GapThreshold : 0;
  return {
    y: gapLengths,
    pointStyles: gapLengths.map((_length, i) => (reversals[i] ? 'highlight' : 'filled')),
    maxY: maxLength === 0 ? 200 : maxLength + 10,
    referenceLine: gapThreshold,
    xLabel: 'Presentation #',
    yLabel: 'Gap Length (ms)',
    title: 'Gap Detection Results',
  };
}
