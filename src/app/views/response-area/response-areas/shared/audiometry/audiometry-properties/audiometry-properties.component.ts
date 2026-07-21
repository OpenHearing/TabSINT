import { Component, Input, OnChanges } from '@angular/core';

/**
 * Displays the current audiometry exam parameters (level, frequency, ear). This implements the input
 * parameters table in specific manner for audiometry related exams.
 */
@Component({
  selector: 'app-audiometry-properties',
  templateUrl: './audiometry-properties.component.html',
  styleUrl: './audiometry-properties.component.css',
})
export class AudiometryPropertiesComponent implements OnChanges {
  @Input() level?: number | string;
  @Input() levelLabel = 'Level';
  @Input() levelUnits?: string;
  @Input() frequency?: number | string;
  @Input() frequencyUnits = 'kHz';
  @Input() ear?: string | string[];

  parameterMap = new Map<string, string>();

  ngOnChanges(): void {
    const map = new Map<string, string>();

    if (this.level !== undefined && this.level !== null && this.level !== '') {
      map.set(this.levelLabel, this.levelUnits ? `${this.level} ${this.levelUnits}` : `${this.level}`);
    }

    if (this.frequency !== undefined && this.frequency !== null && this.frequency !== '') {
      map.set('Frequency', `${this.frequency} ${this.frequencyUnits}`);
    }

    if (this.ear) {
      map.set('Ear', Array.isArray(this.ear) ? this.ear.join(', ') : this.ear);
    }

    this.parameterMap = map;
  }
}
