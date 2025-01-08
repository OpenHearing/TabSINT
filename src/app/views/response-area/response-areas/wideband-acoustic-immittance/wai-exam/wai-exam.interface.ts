import { CommonResponseAreaInterface } from "../../../../../interfaces/page-definition.interface";

export interface WAIInterface extends CommonResponseAreaInterface {
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
    showResults?: boolean
}

export interface WAIResultsInterface { 
    State: string; 
    PctComplete: number;
    NumSweeps?: number;
    DpLow?: WAIDataInterface,
    DpHigh?: WAIDataInterface,
    F1?: WAIDataInterface,
    F2?: WAIDataInterface,
    Raw?: {
      DpLow?: WAIDataInterface,
      DpHigh?: WAIDataInterface,
      F1?: WAIDataInterface,
      F2?: WAIDataInterface,
    }
  }
  
export interface WAIDataInterface {
  Frequency: number[];
  Amplitude: number[];
  Phase: number[];
  NoiseFloor?: number[];
}
