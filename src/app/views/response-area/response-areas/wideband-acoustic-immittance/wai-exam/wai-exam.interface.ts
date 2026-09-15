import { NormativeDataInterface } from '../../../../../interfaces/normative-data-interface';
import { CommonResponseAreaInterface } from '../../../../../interfaces/page-definition.interface';

export interface WAIInterface extends CommonResponseAreaInterface {
  tabsintId?: string;
  outputCalibrationType?: string;
  fStart?: number;
  fEnd?: number;
  sweepDuration?: number;
  sweepType?: 'log' | 'linear';
  l?: number;
  numSweeps?: number;
  windowDuration?: number;
  numFrequencies?: number;
  recordFileFolder?: string;
  outputRawMeasurements?: boolean;
  outputChannel?: string;
  inputChannels?: string[];
  aurenInsideDiameter?: number;
  aurenLength?: number;
  earCanalDiameter?: number;
  earCanalLength?: number;
  writeFPLCalibration?: boolean;
  showResults?: boolean;
  normativeAbsorbanceDataPath?: string;
  normativeAbsorbanceData?: NormativeDataInterface[];
}

/**
 * Properties sent to the device for a WAI firmware exam, used by both the WAI response area and
 * the FPL calibration exam. Field names match the firmware's expected keys, so they are
 * PascalCase rather than camelCase.
 */
export interface WAIExamProperties {
  OutputChannel: string;
  FStart: number;
  FEnd: number;
  SweepDuration: number;
  SweepType: string;
  L: number;
  NumSweeps: number;
  WindowDuration: number;
  NumFrequencies: number;
  OutputRawMeasurements: boolean;
  InputChannels: string[];
  AurenInsideDiameter: number;
  AurenLength: number;
  EarCanalDiameter: number;
  EarCanalLength: number;
  WriteFPLCalibration: boolean;
  /** Set only by the FPL calibration exam, which reads the measurement data back off the device. */
  ReturnResultData?: boolean;
  /** Set only when the protocol asks for the exam audio to be recorded. */
  Filename?: string;
}

export interface WAIResultsInterface {
  State: string;
  PctComplete: number;
  NumSweeps?: number;
  Frequency?: number[];
  ImpedanceAmp?: number[];
  ImpedancePhase?: number[];
  Absorbance?: number[];
  PowerReflectance?: number[]; // not provided by firmware, calculated in tabsint (1-Absorbance)
  Raw?: any;
  // below are likely temporary
  A0_real?: any;
  A0_imag?: any;
  B0_real?: any;
  B0_imag?: any;
  LSF_result?: any;
}

export interface WAIResultsPlotInterface {
  svg: d3.Selection<SVGSVGElement, unknown, HTMLElement, unknown>;
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
