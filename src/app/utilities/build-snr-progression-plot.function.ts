import { TrialProgressionPlotDataInterface } from '../views/response-area/response-areas/shared/trial-progression-plot/trial-progression-plot.interface';

/**
 * Build trial-progression plot data for an SNR-adaptive exam (e.g. HINT, three-digit),
 * one point per presentation showing the SNR used and whether the response was correct.
 * @param presentations Graded presentations, in presentation order.
 * @param referenceLine Optional horizontal reference line (e.g. the exam's computed SRT).
 * @param title Plot title.
 * @returns Plot data for `app-trial-progression-plot`, or undefined if there are no presentations.
 */
export function buildSnrProgressionPlotData(
  presentations: { snr?: number; correct: boolean }[],
  referenceLine?: number,
  title = 'SNR Progression'
): TrialProgressionPlotDataInterface | undefined {
  if (!presentations.length) {
    return undefined;
  }

  return {
    y: presentations.map(presentation => presentation.snr ?? 0),
    pointStyles: presentations.map(presentation => (presentation.correct ? 'filled' : 'open')),
    connectLine: true,
    referenceLine,
    xLabel: 'Presentation #',
    yLabel: 'SNR (dB)',
    title,
  };
}
