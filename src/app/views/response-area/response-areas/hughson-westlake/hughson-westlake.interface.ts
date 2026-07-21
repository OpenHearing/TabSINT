import { AudiometryExamProperties, AudiometryResponseArea } from '../shared/audiometry/audiometry.interface';

/**
 * Properties sent to the CHA when queueing a "HughsonWestlake" exam. These map directly to the
 * fields the CHA firmware expects. See the source chaHughsonWestlake schema for full descriptions.
 */
export interface HughsonWestlakeExamPropertiesInterface extends AudiometryExamProperties {
  Screener?: boolean;
  StepSize?: number;
  TonePulseNumber?: number;
  PollingOffset?: number;
  MinISI?: number;
  MaxISI?: number;
  NumCorrectReq?: number;
  SemiAutomaticMode?: boolean;
  UseReducedInitialIncrement?: boolean;
}

/**
 * Protocol definition for a Hughson-Westlake automated threshold audiometry response area.
 */
export interface HughsonWestlakeResponseAreaInterface extends AudiometryResponseArea {
  type: 'hughsonWestlakeResponseArea';
  tabsintId?: string;
  autoSubmit?: boolean;
  exportToCSV?: boolean;
  examInstructions?: string;
  examProperties?: HughsonWestlakeExamPropertiesInterface;
}

/**
 * Results structure returned by the CHA for a "HughsonWestlake" exam.
 */
export interface HughsonWestlakeResultsInterface {
  RetSPL: number;
  L: number[];
  FalsePositive: number[];
  ResponseTime: number[];
  NumCorrectResp: number;

  // Audiometry Results
  Threshold: number;
  Units: number;
  ResultType: number | string;
}
