/**
 * Append a count-based progress readout to a base task message, e.g. "Processing Protocol...
 * (42%)". Falls back to the unmodified base message when there's nothing to count (`total` is 0).
 * @param baseMessage The task message to prefix.
 * @param done The number of items completed so far.
 * @param total The total number of items to complete.
 * @returns The combined progress message.
 */
export function formatCountProgress(baseMessage: string, done: number, total: number): string {
  if (total <= 0) {
    return baseMessage;
  }
  const percent = Math.round((done / total) * 100);
  return `${baseMessage} (${percent}%)`;
}
