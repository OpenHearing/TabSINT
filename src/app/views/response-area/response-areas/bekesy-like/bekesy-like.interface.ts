import { AudiometryExamProperties, AudiometryResponseArea } from '../shared/audiometry/audiometry.interface';

/**
 * Properties sent to the CHA when queueing a "BekesyLike" exam. These map directly to the fields
 * the CHA firmware expects. See the source chaBekesyLike schema for full descriptions.
 */
export interface BekesyLikeExamPropertiesInterface extends AudiometryExamProperties {
  ReversalDiscard?: number;
  ReversalKeep?: number;
  IncrementStart?: number;
  IncrementNominal?: number;
}

/**
 * Protocol definition for a Bekesy Like threshold audiometry response area.
 */
export interface BekesyLikeResponseAreaInterface extends AudiometryResponseArea {
  type: 'bekesyLikeResponseArea';
  tabsintId?: string;
  autoSubmit?: boolean;
  autoBegin?: boolean;
  exportToCSV?: boolean;
  examInstructions?: string;
  resultMainText?: string;
  resultSubText?: string;
  examProperties?: BekesyLikeExamPropertiesInterface;
}

/**
 * Results structure returned by the CHA for a "BekesyLike" exam.
 */
export interface BekesyLikeResultsInterface {
  RetSPL: number;
  L: number[];
  MaximumExcursion: number;
  Slope: number;

  // Audiometry Results
  Threshold: number;
  Units: number;
  ResultType: number | string;
}
