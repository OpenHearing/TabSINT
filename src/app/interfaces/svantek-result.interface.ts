/**
 * Measurement result captured from a Svantek dosimeter during a protocol page.
 * Stored in CurrentResults.svantek when a page with svantek: true is submitted.
 */
export interface SvantekResultInterface {
  time: string;
  status: number;
  Leq: number[];
  Frequencies: number[];
  LeqA: number;
  LeqC: number;
  LeqZ: number;
  overallAmbientNoise: number;
  FBand?: number | number[];
  bandLevel?: number | number[];
}
