import { AudiometryExamProperties, AudiometryResponseArea } from '../shared/audiometry/audiometry.interface';

/**
 * Properties sent to the CHA when queueing a "BHAFT" exam. These map directly to the fields the
 * CHA firmware expects. See the source chaBHAFT schema for full descriptions.
 */
export interface BhaftExamPropertiesInterface extends AudiometryExamProperties {
  Fstart?: number;
  MaximumOutputFrequency?: number;
  MinimumOutputFrequency?: number;
  Level?: number;
  ReversalDiscard?: number;
  ReversalKeep?: number;
  IncrementStartMultiplierFrequency?: number;
  IncrementNominalFrequency?: number;
  IncrementStartMultiplierLevel?: number;
  IncrementNominalLevel?: number;
  SemiAutomaticMode?: boolean;
}

/**
 * Protocol definition for a Bekesy Highest Audible Frequency Threshold (BHAFT) response area.
 */
export interface BhaftResponseAreaInterface extends AudiometryResponseArea {
  type: 'bhaftResponseArea';
  tabsintId?: string;
  autoSubmit?: boolean;
  autoBegin?: boolean;
  exportToCSV?: boolean;
  examInstructions?: string;
  resultMainText?: string;
  resultSubText?: string;
  examProperties?: BhaftExamPropertiesInterface;
}

/**
 * Results structure returned by the CHA for a "BHAFT" exam.
 */
export interface BhaftResultsInterface {
  ThresholdFrequency: number;
  ThresholdLevel: number;
  F: number[];
  L: number[];
  ResultType: number | string;
}
