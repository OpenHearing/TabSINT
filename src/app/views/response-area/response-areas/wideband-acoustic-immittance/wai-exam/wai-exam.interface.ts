import { CommonResponseAreaInterface } from "../../../../../interfaces/page-definition.interface";

export interface WAIInterface extends CommonResponseAreaInterface {
  exportToCSV?: boolean;
  tabsintId?: string;
  fStart?: number,
  fEnd?: number,
  sweepDuration?: number,
  sweepType?: 'log' | 'linear',
  level?: number,
  numSweeps?: number,
  windowDuration?: number,
  numFrequencies?: number,
  filename?: string,
  outputRawMeasurements?: boolean,
  showResults?: boolean
}

export interface WAIResultsInterface { 
  State: string; 
  PctComplete: number;
  NumSweeps?: number;
  Frequency?: Array<number>;
  ImpedanceAmp?: Array<number>;
  ImpedancePhase?: Array<number>;
  Absorbance?: Array<number>;
  PowerReflectance?: Array<number>;
}

export interface WAIResultsPlotInterface { 
  svg: any;
  chartX: number;
  chartY: number;
  chartWidth: number;
  chartHeight: number;
  xTicks: number[];
  xScale: d3.ScaleLogarithmic<number, number, never>;
  yScale: d3.ScaleLinear<number, number, never>;
  yAxisFormat: string;
  yAxisName: string;
}