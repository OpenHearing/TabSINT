import { Component, Input, OnChanges } from '@angular/core';

import { AudiometryResultsInterface } from '../../../../../../interfaces/audiometry-results.interface';
import { ResultType } from '../../../../../../utilities/constants';

/** A single frequency/threshold entry for one channel, ready for tabular display. */
interface AudiometryChannelRow {
  frequency: number;
  threshold: number | null;
  resultType: string;
  masking: boolean;
}

/** All rows belonging to a single channel (e.g. left/right/mono), sorted by frequency. */
interface AudiometryChannelGroup {
  channel: string;
  rows: AudiometryChannelRow[];
  hasMasking: boolean;
}

/**
 * Tabular audiometry results view (one table per channel, ordered by frequency), shared
 * across audiometry exams so each one doesn't have to hand-roll its own per-ear table.
 * Pairs naturally with app-audiogram, which already consumes the same
 * AudiometryResultsInterface shape.
 */
@Component({
  selector: 'app-audiometry-results-table',
  templateUrl: './audiometry-results-table.component.html',
  styleUrl: './audiometry-results-table.component.css',
})
export class AudiometryResultsTableComponent implements OnChanges {
  @Input() dataStruct!: AudiometryResultsInterface;
  @Input() showLegend = true;

  channelGroups: AudiometryChannelGroup[] = [];

  ngOnChanges(): void {
    this.channelGroups = this.groupResultsByChannel(this.dataStruct);
  }

  /**
   * Format a threshold for display.
   */
  formatThreshold(threshold: number | null, resultType: string): string {
    if (threshold === null) {
      return '-';
    }

    switch (resultType) {
      case ResultType.Better:
        return `(${threshold})`;
      case ResultType.Beyond:
        return `(${threshold}+)`;
      default:
        return `${threshold}`;
    }
  }

  /**
   * Format channel name for display.
   * @param channel The channel name.
   * @returns The formatted name.
   */
  formatChannelName(channel: string) {
    if (!channel) return channel; // Handles empty strings, null, or undefined
    return channel
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Get a color to format the channel table with.
   * @param channel The channel to check.
   * @returns The background color for the channel table.
   */
  formatChannelColor(channel: string) {
    switch (channel) {
      case 'left':
      case 'bone_left':
        return '#007bff';
      case 'right':
      case 'bone_right':
        return '#dc3545';
      default:
        return 'black';
    }
  }

  /**
   * Group the parallel arrays of an AudiometryResultsInterface by channel, sorting each
   * channel's rows by frequency.
   */
  groupResultsByChannel(dataStruct: AudiometryResultsInterface | undefined): AudiometryChannelGroup[] {
    if (!dataStruct) {
      return [];
    }

    const rowsByChannel = new Map<string, AudiometryChannelRow[]>();

    dataStruct.frequencies.forEach((frequency, index) => {
      const channel = dataStruct.channels[index];
      const rows = rowsByChannel.get(channel) ?? [];
      rows.push({
        frequency,
        threshold: dataStruct.thresholds[index],
        resultType: dataStruct.resultTypes[index],
        masking: dataStruct.masking[index],
      });
      rowsByChannel.set(channel, rows);
    });

    return Array.from(rowsByChannel.entries()).map(([channel, rows]) => ({
      channel,
      rows: [...rows].sort((a, b) => a.frequency - b.frequency),
      hasMasking: rows.some(row => row.masking),
    }));
  }
}
