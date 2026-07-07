import { CommonResponseAreaInterface } from '../../../../interfaces/page-definition.interface';
import { IDeviceResponse } from '../../../../interfaces/devices/device-response.interface';

/**
 * Language of the HINT sentence material.
 */
export enum HintLanguage {
  English = 'english',
  Mandarin = 'mandarin',
  Military = 'military',
  Swahili = 'swahili',
  LaSpanish = 'laspanish',
  Portuguese = 'portuguese',
  PLaSpanish = 'plaspanish',
  FrenchCanadian = 'frenchcan',
}

/**
 * Spatial direction of the speech presentation relative to the masking noise.
 */
export enum HintDirection {
  Front = 'front',
  Left = 'left',
  Right = 'right',
  Quiet = 'quiet',
}

/**
 * Type of masker played against the target speech.
 */
export enum HintMaskerType {
  Noise = 'noise',
  TwoBabble = '2babble',
}

/**
 * Properties sent to the CHA when queueing a "HINT" exam. These map directly to the
 * fields the CHA firmware expects. See the source chaHINT schema for full descriptions.
 */
export interface HintExamPropertiesInterface {
  Language?: HintLanguage;
  IsPractice?: boolean;
  Direction?: HintDirection;
  NoiseLevel?: number;
  MaskerType?: HintMaskerType;
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
  examInstructions?: string;
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
