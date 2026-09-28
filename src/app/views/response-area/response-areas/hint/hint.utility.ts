import { HintDeviceResultsInterface, HintExamPropertiesInterface, HintExamSummaryInterface } from './hint.interface';
import { ProtocolInterface } from '../../../../models/protocol/protocol.interface';

const SCORING_METHOD = 'word';

/**
 * Build the exam-level summary details shown alongside a HINT exam's per-presentation results.
 * @param examProperties The page's configured exam properties.
 * @param results The final device results, carrying the computed SRT.
 * @param protocol The exam's protocol, for the summary's protocol name.
 * @param testDateTime The exam's start time.
 */
export function buildHintExamSummary(
  examProperties: HintExamPropertiesInterface,
  results: HintDeviceResultsInterface,
  protocol: Partial<ProtocolInterface> | undefined,
  testDateTime: string | undefined
): HintExamSummaryInterface {
  return {
    srt: results.sSRT,
    protocolName: protocol?.title ?? protocol?.name,
    examType: examProperties.Language,
    direction: examProperties.Direction,
    scoring: SCORING_METHOD,
    listNumber: examProperties.ListNumber,
    startDateTime: testDateTime,
    endDateTime: new Date().toJSON(),
  };
}
