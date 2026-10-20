import { Component, Input, OnChanges } from '@angular/core';

import { CurrentResults } from '../../../../../models/results/results.interface';
import { AudiometryResultsInterface } from '../../../../../interfaces/audiometry-results.interface';
import { assembleAudiometryResults, getDefaultLevelUnits } from '../../shared/audiometry/audiometry.utility';
import {
  HughsonWestlakeExamPropertiesInterface,
  HughsonWestlakeResponseAreaInterface,
  HughsonWestlakeResultsInterface,
} from '../../hughson-westlake/hughson-westlake.interface';
import { buildHughsonWestlakeAudiogramDatum } from '../../hughson-westlake/hughson-westlake.utility';
import { BhaftResponseAreaInterface, BhaftResultsInterface } from '../../bhaft/bhaft.interface';
import { buildBhaftAudiogramDatum, getBhaftLevelUnits } from '../../bhaft/bhaft.utility';
import { BekesyLikeResponseAreaInterface, BekesyLikeResultsInterface } from '../../bekesy-like/bekesy-like.interface';
import { buildBekesyLikeAudiogramDatum } from '../../bekesy-like/bekesy-like.utility';

/**
 * Renders a single stored audiometry-family response (Hughson-Westlake, BHAFT, or bekesy-like)
 * as a one-page combined audiogram, reusing the same builder functions the live exam uses when
 * assembling a multi-page combined audiogram.
 */
@Component({
  selector: 'app-audiometry-result-viewer',
  templateUrl: './audiometry-result-viewer.component.html',
})
export class AudiometryResultViewerComponent implements OnChanges {
  @Input() result!: CurrentResults;

  dataStruct: AudiometryResultsInterface = assembleAudiometryResults([], '');

  ngOnChanges(): void {
    this.dataStruct = this.buildDataStruct();
  }

  /**
   * A Hughson-Westlake screener is pass/fail at a single level, so - as in the live exam - it is
   * shown as its exam parameters and outcome rather than as an audiogram.
   */
  get screenerProperties(): HughsonWestlakeExamPropertiesInterface | undefined {
    if (this.result?.responseArea !== 'hughsonWestlakeResponseArea') {
      return undefined;
    }
    const examProperties = (this.result.page?.responseArea as HughsonWestlakeResponseAreaInterface)?.examProperties;
    return examProperties?.Screener ? examProperties : undefined;
  }

  get screenerOutcome(): string {
    return String((this.result.response as HughsonWestlakeResultsInterface)?.ResultType ?? '');
  }

  private buildDataStruct(): AudiometryResultsInterface {
    switch (this.result.responseArea) {
      case 'hughsonWestlakeResponseArea': {
        const examProperties = (this.result.page?.responseArea as HughsonWestlakeResponseAreaInterface)?.examProperties ?? {};
        const datum = buildHughsonWestlakeAudiogramDatum(examProperties, this.result.response as HughsonWestlakeResultsInterface);
        return assembleAudiometryResults(datum ? [datum] : [], getDefaultLevelUnits(examProperties));
      }
      case 'bhaftResponseArea': {
        const examProperties = (this.result.page?.responseArea as BhaftResponseAreaInterface)?.examProperties ?? {};
        const datum = buildBhaftAudiogramDatum(examProperties, this.result.response as BhaftResultsInterface);
        return assembleAudiometryResults(datum ? [datum] : [], getBhaftLevelUnits());
      }
      case 'bekesyLikeResponseArea': {
        const examProperties = (this.result.page?.responseArea as BekesyLikeResponseAreaInterface)?.examProperties ?? {};
        const datum = buildBekesyLikeAudiogramDatum(examProperties, this.result.response as BekesyLikeResultsInterface);
        return assembleAudiometryResults(datum ? [datum] : [], getDefaultLevelUnits(examProperties));
      }
      default:
        return assembleAudiometryResults([], '');
    }
  }
}
