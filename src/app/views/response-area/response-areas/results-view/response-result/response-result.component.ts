import { Component, Input, inject } from '@angular/core';

import { CurrentResults } from '../../../../../models/results/results.interface';
import { ResultsModel } from '../../../../../models/results/results-model.service';
import { ThreeDigitPresentationResultInterface, ThreeDigitResponseInterface } from '../../three-digit/three-digit.interface';
import { MrtResultsInterface, MrtTrialResultInterface } from '../../mrt/mrt-exam/mrt-exam.interface';
import { gradeMrtExam } from '../../mrt/mrt-exam/mrt-exam.utility';
import {
  HintExamSummaryInterface,
  HintPresentationResultInterface,
  HintResponseAreaInterface,
  HintResponseInterface,
} from '../../hint/hint.interface';
import { buildHintExamSummary } from '../../hint/hint.utility';
import { GapResultsInterface } from '../../gap/gap.interface';

/**
 * Dispatches a single stored page result to the viewer for its responseArea type, falling back to
 * a generic key/value rendering for any type without a dedicated viewer - so no response-area type
 * is ever silently dropped from a results-view page.
 */
@Component({
  selector: 'app-response-result',
  templateUrl: './response-result.component.html',
})
export class ResponseResultComponent {
  private readonly resultsModel = inject(ResultsModel);

  @Input() result!: CurrentResults;

  get threeDigitPresentations(): ThreeDigitPresentationResultInterface[] {
    return (this.result.response as ThreeDigitResponseInterface)?.presentations ?? [];
  }

  get mrtResults(): MrtResultsInterface[] {
    return gradeMrtExam((this.result.response as MrtTrialResultInterface[]) ?? []);
  }

  get hintPresentations(): HintPresentationResultInterface[] {
    return (this.result.response as HintResponseInterface)?.presentations ?? [];
  }

  get hintSummary(): HintExamSummaryInterface | undefined {
    const response = this.result.response as HintResponseInterface;
    if (!response?.results) {
      return undefined;
    }
    const examProperties = (this.result.page?.responseArea as HintResponseAreaInterface)?.examProperties ?? {};
    const currentExam = this.resultsModel.getResults().currentExam;
    return buildHintExamSummary(examProperties, response.results, currentExam?.protocol, currentExam?.testDateTime);
  }

  get gapResults(): GapResultsInterface {
    return (this.result.response as GapResultsInterface) ?? {};
  }
}
