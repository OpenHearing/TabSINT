import { CommonResponseAreaInterface } from "../../../../../interfaces/page-definition.interface";

export interface SweptDpoaeInterface extends CommonResponseAreaInterface {
  exportToCSV?: boolean;
  tabsintId?: string;
  f2Start?: number,
  f2End?: number,
  frequencyRatio?: number,
  sweepDuration?: number,
  windowDuration?: number,
  sweepType?: 'log' | 'linear',
  minSweeps?: number,
  maxSweeps?: number,
  noiseFloorThreshold?: number,
  outputRawMeasurements?: boolean,
  showResults?: boolean
}

export interface SweptDpoaeResultsInterface { 
  State: string; 
  PctComplete: number;
  NumSweeps?: number;
  DpLow?: DPOAEDataInterface,
  DpHigh?: DPOAEDataInterface,
  F1?: DPOAEDataInterface,
  F2?: DPOAEDataInterface,
  Raw?: {
    DpLow?: DPOAEDataInterface,
    DpHigh?: DPOAEDataInterface,
    F1?: DPOAEDataInterface,
    F2?: DPOAEDataInterface,
  }
}
  
export interface DPOAEDataInterface {
  Frequency: number[];
  Amplitude: number[];
  Phase: number[];
  NoiseFloor?: number[];
}
