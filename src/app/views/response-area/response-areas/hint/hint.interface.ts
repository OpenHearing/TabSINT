import { CommonResponseAreaInterface } from '../../../../interfaces/page-definition.interface';
import { IDeviceResponse } from '../../../../interfaces/devices/device-response.interface';

/**
 * Properties sent to the CHA when queueing a "HINT" exam. These map directly to the
 * fields the CHA firmware expects. See the source chaHINT schema for full descriptions.
 */
export interface HintExamPropertiesInterface {
  Language?: 'english' | 'mandarin' | 'military' | 'swahili' | 'laspanish' | 'portuguese' | 'plaspanish' | 'frenchcan';
  IsPractice?: boolean;
  Direction?: 'front' | 'left' | 'right' | 'quiet';
  NoiseLevel?: number;
  MaskerType?: 'noise' | '2babble';
  InitialStepSize?: number;
  StepSize?: number;
  InitialSNR?: number;
  ListNumber?: number;
  NumberOfPresentations?: number;
  DisableRepeatFirstUntilCorrect?: boolean;
}

/**
 * Protocol definition for a Hearing In Noise Test (HINT) response area.
 */
export interface HintResponseAreaInterface extends CommonResponseAreaInterface {
  type: 'hintResponseArea';
  tabsintId?: string;
  autoSubmit?: boolean;
  autoBegin?: boolean;
  examInstructions?: string;
  measureBackground?: 'ThirdOctaveBands';
  examProperties?: HintExamPropertiesInterface;
}

/**
 * Results structure returned by the CHA for a "HINT" exam, polled via requestResults.
 * State 0 = presentation ready (a sentence to score), 2 = exam complete.
 */
export interface HintDeviceResultsInterface {
  State?: number;
  SentencePath?: string | number;
  ListLength?: number;
  CurrentSentenceIndex?: number;
  CurrentSentence?: string;
  CurrentSNR?: number;
  sSRT?: number;
  sSRTstd?: number;
  presentationId?: string | number;
}

/**
 * A requestResults device response whose payload is a HINT results object.
 */
export interface HintResultsResponse extends IDeviceResponse {
  msg: [unknown, HintDeviceResultsInterface];
}

/**
 * Graded result for a single sentence presentation, accumulated across the exam.
 */
export interface HintPresentationResultInterface {
  presentationId?: string | number;
  responseStartTime: string;
  sentence: string[];
  response: number[];
  selectedWords: string[];
  numberCorrect: number;
  wordCount: number;
  correct: boolean;
  responseToCha: number;
}

/**
 * Aggregate response stored for the page once the exam completes.
 */
export interface HintResponseInterface {
  presentations: HintPresentationResultInterface[];
  presentationCount?: number;
  correctPresentationCount?: number;
  results?: HintDeviceResultsInterface;
}
