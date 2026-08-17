import { NormativeDataInterface } from '../../../../../interfaces/normative-data-interface';
import { CommonResponseAreaInterface } from '../../../../../interfaces/page-definition.interface';

/** Fixed Y-axis domain (dB) shared by every DPOAE-family plot (in-progress and results, DP-gram and Swept DPOAE). */
export const DPOAE_Y_AXIS_DOMAIN: [number, number] = [-40, 100];

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
