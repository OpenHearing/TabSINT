/**
 * Round a value to a fixed number of decimal places. NaN passes through unchanged.
 * @param value The value to round.
 * @param decimals The number of decimal places to keep.
 * @returns The rounded value.
 */
export function round(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}
