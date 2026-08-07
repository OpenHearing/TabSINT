import { NormativeDataInterface } from '../../../../../interfaces/normative-data-interface';
import { CommonResponseAreaInterface } from '../../../../../interfaces/page-definition.interface';

export interface DpoaeCommonInterface extends CommonResponseAreaInterface {
  exportToCSV?: boolean;
  tabsintId?: string;
  outputCalibrationType?: string;
  outputChannel1?: string;
  outputChannel2?: string;
  inputChannel?: string;
  ratio?: number;
  l1?: number;
  l2?: number;
  noiseFloorThreshold?: number;
  SNRThreshold?: number;
  recordFileFolder?: string;
  outputRawMeasurements?: boolean;
  showResults?: boolean;
  normativeDataPath?: string;
  normativeData?: NormativeDataInterface[];
  autoSubmit?: boolean;
}

export interface DpoaeResultsCommonInterface {
  State: string;
  PctComplete: number;
}

export interface DPOAEDataInterface {
  Frequency: number[];
  Amplitude: number[];
  Phase: number[];
  NoiseFloor?: number[];
}
