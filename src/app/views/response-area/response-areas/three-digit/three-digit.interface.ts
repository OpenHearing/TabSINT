import { CommonResponseAreaInterface } from '../../../../interfaces/page-definition.interface';

export enum ThreeDigitTargetType {
  Filtered = 'filtered',
  TimeCompressed = 'timeCompressed',
  H3CamFiltered = 'H3CamFiltered',
  TFS = 'TFS',
  Swahili = 'Swahili',
  Mandarin = 'MANDARIN',
  Portuguese = 'PORTUGUE',
  French = 'French',
}

export enum ThreeDigitMaskerType {
  Schroeder = 'schroeder',
  Babble = '2babble',
}

export enum ThreeDigitWarmupMasker {
  None = 'none',
  NegativePhase = 'negativePhase',
  PositivePhase = 'positivePhase',
  Babble = '2babble',
}

/**
 * Properties sent to the CHA when queueing a "ThreeDigit" exam. These map directly to the
 * fields the CHA firmware expects. See the source chaThreeDigit schema for full descriptions.
 */
export interface ThreeDigitExamPropertiesInterface {
  nPresentations?: number;
  warmupN?: number;
  targetType?: ThreeDigitTargetType;
  maskerType?: ThreeDigitMaskerType;
  warmupMasker?: ThreeDigitWarmupMasker;
  initialSNR?: number;
  fixedLevel?: number;
  fixedMaterial?: 'target' | 'masker';
  correctStep?: number;
  incorrectStep?: number;
  warmupCorrectStep?: number;
  warmupIncorrectStep?: number;
  ear?: 'left' | 'right' | 'both';
}

/**
 * Protocol definition for a Three Digit Test response area.
 */
export interface ThreeDigitResponseAreaInterface extends CommonResponseAreaInterface {
  type: 'threeDigitResponseArea';
  tabsintId?: string;
  autoSubmit?: boolean;
  autoSubmitPresentation?: boolean;
  keypadDelay?: number;
  feedback?: boolean;
  feedbackDelay?: number;
  examInstructions?: string;
  exportToCSV?: boolean;
  examProperties?: ThreeDigitExamPropertiesInterface;
}

/**
 * Results structure returned by the CHA for a "ThreeDigit" exam, polled via requestResults.
 * State 0 = presentation running, 1 = waiting for the graded response, 2 = exam complete.
 * Mirrors the device's TestThreeDigitResults class.
 */
export interface ThreeDigitDeviceResultsInterface {
  State?: number;
  currentPresentation?: string;
  currentDigits?: number | string;
  currentSNR?: number;
  presentationCount?: number;
  presentationId?: number;
  currentMasker?: ThreeDigitWarmupMasker;
  digitScore?: number;
  presentationScore?: number;
  maskerLevel?: number;
  targetLevel?: number;
  targetType?: ThreeDigitTargetType;
  warmupDigitScore?: number;
  warmupPresentationScore?: number;
  ear?: 'left' | 'right' | 'both';
  warmupSRT?: number;
  SRT?: number;
}

/**
 * Graded result for a single presentation, accumulated across the exam. Carries the device
 * context for the presentation alongside the graded response.
 */
export interface ThreeDigitPresentationResultInterface {
  presentationId?: number;
  presentationCount?: number;
  responseStartTime: string;
  currentPresentation?: string;
  response: string[];
  currentDigits: string[];
  currentSNR?: number;
  currentMasker?: ThreeDigitWarmupMasker;
  numberCorrect: number;
  numberIncorrect: number;
  eachCorrect: boolean[];
  correct: boolean;
}

/**
 * Aggregate response stored for the page once the exam completes. `results` holds the full
 * final TestThreeDigitResults payload from the device (SRT, warmup scores, etc.).
 */
export interface ThreeDigitResponseInterface {
  presentations: ThreeDigitPresentationResultInterface[];
  results?: ThreeDigitDeviceResultsInterface;
}
