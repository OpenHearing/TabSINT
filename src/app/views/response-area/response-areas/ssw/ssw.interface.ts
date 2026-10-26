import { CommonResponseAreaInterface } from '../../../../interfaces/page-definition.interface';

/**
 * Language of the SSW spondee material. The enumeration order matters: the CHA expects the
 * zero-based index of the language rather than its name.
 */
export enum SswLanguage {
  AmericanEnglish = 'amEng',
  Swahili = 'swahili',
  Practice = 'practice',
  Mandarin = 'mandarin',
  Swahili2 = 'swahili2',
  SwahiliPractice = 'swahilip',
  French = 'french',
  FrenchPractice = 'frenchp',
}

/**
 * Properties a protocol may set for a Staggered Spondaic Word (SSW) exam. See the source chaSSW
 * schema for full descriptions.
 */
export interface SswExamPropertiesInterface {
  language?: SswLanguage;
  randomOrder?: number;
  nPresentations?: number;
  groupedPresentations?: number[];
  playCarrier?: number;
  playHiss?: number;
  presentationLevel?: number;
  firstEar?: number;
  waitDur?: number;
}

/**
 * Properties sent to the CHA when queueing an "SSW" exam. Identical to the protocol properties
 * except that the language is sent as its enumeration index.
 */
export interface SswDeviceExamPropertiesInterface extends Omit<SswExamPropertiesInterface, 'language'> {
  language: number;
}

/**
 * Protocol definition for a Staggered Spondaic Word (SSW) response area.
 */
export interface SswResponseAreaInterface extends CommonResponseAreaInterface {
  type: 'sswResponseArea';
  tabsintId?: string;
  autoSubmit?: boolean;
  examInstructions?: string;
  examProperties?: SswExamPropertiesInterface;
}

/**
 * Exam states reported by the CHA in the "SSW" results.
 */
export enum SswDeviceState {
  Loading = 'LOADING',
  Playing = 'PLAYING',
  WaitingForResult = 'WAITING_FOR_RESULT',
  Done = 'DONE',
}

/**
 * Results structure returned by the CHA for an "SSW" exam, polled via requestResults.
 */
export interface SswDeviceResultsInterface {
  State?: SswDeviceState | string;
  presentationNumber?: number;
  currentPresentation?: string;
  firstEar?: string;
  presentationId?: string | number;
}

/**
 * Graded result for a single spondee presentation, accumulated across the exam.
 * `response[i]` holds the order (1-based) in which the subject repeated word `i`, or 0 when the
 * word was missed.
 */
export interface SswPresentationResultInterface {
  presentationId?: string | number;
  presentationNumber?: number;
  responseStartTime: string;
  responseElapTimeMS: number;
  firstEar?: string;
  words: string[];
  response: number[];
  numberCorrect: number;
  wordCount: number;
  correct: boolean;
  responseToCha: number[];
  notes: string;
}

/**
 * Aggregate response stored for the page once the exam completes.
 */
export interface SswResponseInterface {
  presentations: SswPresentationResultInterface[];
  presentationCount?: number;
  correctPresentationCount?: number;
  results?: SswDeviceResultsInterface;
}
