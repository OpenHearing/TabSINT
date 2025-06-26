import { CommonResponseAreaInterface } from "../../../../../interfaces/page-definition.interface";

export interface WAIInterface extends CommonResponseAreaInterface {
  exportToCSV?: boolean;
  tabsintId?: string;
  fStart?: number,
  fEnd?: number,
  sweepDuration?: number,
  sweepType?: 'log' | 'linear',
  l?: number,
  numSweeps?: number,
  windowDuration?: number,
  numFrequencies?: number,
  filename?: string,
  outputRawMeasurements?: boolean,
  outputChannel?: string,
  inputChannels?: Array<string>,
  aurenInsideDiameter?: number,
  aurenLength?: number,
  earCanalDiameter?: number,
  earCanalLength?: number,
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
  PowerReflectance?: Array<number>; // not provided by firmware, calculated in tabsint (1-Absorbance)
  Raw?: any;
  // below are likely temporary
  A0_real?: any,
  A0_imag?: any,
  B0_real?: any,
  B0_imag?: any,
  LSF_result?: any
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