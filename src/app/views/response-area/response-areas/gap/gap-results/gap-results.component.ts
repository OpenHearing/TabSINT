import { Component, Input } from '@angular/core';
import { GapResultsInterface } from '../gap.interface';

interface GapTrialResult {
  gapLength: number;
  hit: boolean;
  reversal: boolean;
}

@Component({
  selector: 'app-gap-results',
  templateUrl: './gap-results.component.html',
  styleUrl: './gap-results.component.css',
})
export class GapResultsComponent {
  @Input() results!: GapResultsInterface;

  get trials(): GapTrialResult[] {
    const gapLengths = this.results.GapLengthArray ?? [];
    const hits = this.results.HitOrMissArray ?? [];
    const reversals = this.results.ReversalUsedForThresholdArray ?? [];
    return gapLengths.map((gapLength, i) => ({
      gapLength,
      hit: hits[i] ?? false,
      reversal: reversals[i] ?? false,
    }));
  }
}
