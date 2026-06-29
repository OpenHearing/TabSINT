import { CommonResponseAreaInterface } from '../../../../interfaces/page-definition.interface';

/**
 * Properties sent to the CHA when queueing a "ThreeDigit" exam. These map directly to the
 * fields the CHA firmware expects. See the source chaThreeDigit schema for full descriptions.
 */
export interface ThreeDigitExamPropertiesInterface {
  nPresentations?: number;
  warmupN?: number;
  targetType?: 'filtered' | 'timeCompressed' | 'H3CamFiltered' | 'TFS' | 'Swahili' | 'Mandarin' | 'Portuguese' | 'French';
  maskerType?: 'schroeder' | '2babble';
  warmupMasker?: 'none' | 'negativePhase' | 'positivePhase' | '2babble';
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
  autoBegin?: boolean;
  keypadDelay?: number;
  feedback?: boolean;
  feedbackDelay?: number;
  examInstructions?: string;
  measureBackground?: 'ThirdOctaveBands';
  exportToCSV?: boolean;
  examProperties?: ThreeDigitExamPropertiesInterface;
}

/**
 * Results structure returned by the CHA for a "ThreeDigit" exam, polled via requestResults.
 * State 0 = presentation running, 1 = waiting for the graded response, 2 = exam complete.
 */
export interface ThreeDigitDeviceResultsInterface {
  State?: number;
  currentDigits?: number | string;
  presentationId?: number;
  digitScore?: number;
  presentationScore?: number;
  currentMasker?: string;
  targetType?: string;
  currentSNR?: number;
  maskerLevel?: number;
  targetLevel?: number;
}

/**
 * Graded result for a single presentation, accumulated across the exam.
 */
export interface ThreeDigitPresentationResultInterface {
  presentationId?: number;
  responseStartTime: string;
  response: string[];
  currentDigits: string[];
  numberCorrect: number;
  numberIncorrect: number;
  eachCorrect: boolean[];
  correct: boolean;
}

/**
 * Aggregate response stored for the page once the exam completes.
 */
export interface ThreeDigitResponseInterface {
  presentations: ThreeDigitPresentationResultInterface[];
  digitScore?: number;
  presentationScore?: number;
}
