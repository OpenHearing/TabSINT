import { CommonResponseAreaInterface } from '../../../../interfaces/page-definition.interface';

/**
 * Properties sent to the CHA when queueing a "GAP" exam. These map directly to the
 * fields the CHA firmware expects. See the source chaGAP schema for full descriptions.
 */
export interface GapExamPropertiesInterface {
  Channel?: number;
  TimePres?: number;
  LNoise?: number;
  AllowableGapLengths?: number[];
  TimeLead?: number;
  TimeTrail?: number;
  TimeWindow?: number;
  TimeNoResp?: number;
  TimePause?: number;
  GapLengthStartIndex?: number;
  NReversalsCalc?: number;
  NReversals?: number;
  NLowestReversals?: number;
  NPresMax?: number;
  NHits?: number;
  NMiss?: number;
  NPresCheck?: number;
  MaxFreq?: number;
  UseSoftwareButton?: 0 | 1;
  SendFullResults?: 0 | 1 | 2;
  SemiAutomaticMode?: boolean;
}

/**
 * Protocol definition for a Gap Detection response area.
 */
export interface GapResponseAreaInterface extends CommonResponseAreaInterface {
  type: 'gapResponseArea';
  tabsintId?: string;
  autoSubmit?: boolean;
  feedback?: boolean;
  feedbackDelay?: number;
  training?: boolean;
  trainingAllowableGapLengths?: number[];
  examInstructions?: string;
  examProperties?: GapExamPropertiesInterface;
}

/**
 * Results structure returned by the CHA for a "GAP" exam, polled via requestResults.
 */
export interface GapResultsInterface {
  State?: string;
  GapThreshold?: number;
  GapLengthArray?: number[];
  HitOrMissArray?: boolean[];
  ReversalUsedForThresholdArray?: boolean[];
  // Fields used during training to drive the canvas animation.
  // Note: the scalar HitOrMiss is an integer (1 = hit, 0 = miss/no-response), even though
  // HitOrMissArray is delivered as booleans via the CHA's getter.
  PlayPosition?: number;
  CurrentGapStartTime?: number;
  HitOrMiss?: number;
}
