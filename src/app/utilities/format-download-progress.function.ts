import { ProgressStatus } from '@capacitor/file-transfer';

/**
 * Append a byte-based progress readout to a base task message, e.g. "Downloading Protocol Files
 * (42% — 5.2/12.3 MB)". Falls back to the unmodified base message when the content length isn't
 * known (`lengthComputable` is false), since a percentage can't be computed in that case.
 * @param baseMessage The task message to prefix.
 * @param status The progress event reported by `@capacitor/file-transfer`.
 * @returns The combined progress message.
 */
export function formatDownloadProgress(baseMessage: string, status: ProgressStatus): string {
  if (!status.lengthComputable || status.contentLength <= 0) {
    return baseMessage;
  }
  const percent = Math.round((status.bytes / status.contentLength) * 100);
  const doneMB = (status.bytes / (1024 * 1024)).toFixed(1);
  const totalMB = (status.contentLength / (1024 * 1024)).toFixed(1);
  return `${baseMessage} (${percent}% — ${doneMB}/${totalMB} MB)`;
}
