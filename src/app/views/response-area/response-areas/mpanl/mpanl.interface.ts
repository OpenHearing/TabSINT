import { CommonResponseAreaInterface } from '../../../../interfaces/page-definition.interface';
import { SvantekResultInterface } from '../../../../interfaces/svantek-result.interface';

export type MpanlStandard = 'ANSI S3.1-R2008' | 'DoD' | 'OSHA';

/**
 * Protocol definition for the MPANL (Maximum Permissible Ambient Noise Levels) response area.
 * Measures ambient noise in octave bands with a Svantek dosimeter and compares it against a
 * published noise-limit standard, to confirm the test environment is quiet enough for testing.
 */
export interface MpanlResponseAreaInterface extends CommonResponseAreaInterface {
  type: 'mpanlResponseArea';
  tabsintId?: string;
  autoSubmit?: boolean;
  standard?: MpanlStandard;
  durations?: number[];
  F?: number[];
  MPANL?: number[];
  attenuation?: number[];
  exportToCSV?: boolean;
}

/**
 * One octave-band row of MPANL results. Units of dB SPL.
 */
export interface MpanlDatumInterface {
  freq: number;
  level: number;
  limit: number;
  attenuation: number;
  levelUnderHeadset: number;
  noiseFloor?: number;
}

export interface MpanlResultsInterface {
  standard: MpanlStandard;
  duration: number;
  data: MpanlDatumInterface[];
  svantek?: SvantekResultInterface;
}
