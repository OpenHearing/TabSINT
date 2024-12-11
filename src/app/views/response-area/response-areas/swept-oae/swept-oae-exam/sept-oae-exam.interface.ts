import { CommonResponseAreaInterface } from "../../../../../interfaces/page-definition.interface";

export interface SweptOaeInterface extends CommonResponseAreaInterface {
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

export interface SweptOaeResultsInterface { 
    State: string; 
    PctComplete: number;
    NumSweeps?: number;
    DpLow?: {
      Frequency: number[];
      Amplitude: number[];
      Phase: number[];
      NoiseFloor: number[];
    },
    DpHigh?: {
      Frequency: number[];
      Amplitude: number[];
      Phase: number[];
      NoiseFloor: number[];
    },
    F1?: {
      Frequency: number[];
      Amplitude: number[];
      Phase: number[];
    },
    F2?: {
      Frequency: number[];
      Amplitude: number[];
      Phase: number[];
    },
    Raw?: {
      DpLow?: {
        Frequency: number[];
        Amplitude: number[];
        Phase: number[];
        NoiseFloor: number[];
      },
      DpHigh?: {
        Frequency: number[];
        Amplitude: number[];
        Phase: number[];
        NoiseFloor: number[];
      },
      F1?: {
        Frequency: number[];
        Amplitude: number[];
        Phase: number[];
      },
      F2?: {
        Frequency: number[];
        Amplitude: number[];
        Phase: number[];
      },
    }
  }