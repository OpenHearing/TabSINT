import { CommonResponseAreaInterface } from '../../../../../interfaces/page-definition.interface';

export enum AudiometryLevelUnits {
  dbHl = 'dB HL',
  dbSpl = 'dB SPL',
}

export enum AudiometryOutputChannel {
  HPR0 = 'HPR0',
  HPL0 = 'HPL0',
  LINEL0 = 'LINEL0',
  NONE_LINEL0 = 'NONE LINEL0',
  LINEL0_NONE = 'LINEL0 NONE',
}

export enum AudiometryDevForm {
  None = 'None',
  Sine = 'Sine',
  Triangle = 'Triangle',
}

export enum AudiometryMaskingShape {
  White = 'White',
  Pink = 'Pink',
  Brown = 'Brown',
}

export enum AudiometryHideExamProps {
  Before = 'before',
  During = 'during',
  Always = 'always',
  Never = 'never',
}

export interface MaskingNoise {
  Type?: AudiometryMaskingShape;
  BandpassCenterFrequency?: number;
  BandpassOctaveWidth?: number;
  Ear?: number;
  Level?: number[];
}

export interface PlotProperties {
  displayAudiogram?: string[];
}

export interface AudiometryExamProperties {
  // Audiometry Level
  F?: number;
  Lstart?: number;
  MaximumOutputLevel?: number;
  MinimumOutputLevel?: number;

  // Audiometry
  LevelUnits?: AudiometryLevelUnits;
  ToneRepetitionInterval?: number;
  PresentationMax?: number;
  UnresponsiveMax?: number;
  UseSoftwareButton?: boolean;
  BypassCalibrationLimit?: boolean;

  // Tone Generation
  OutputChannel?: AudiometryOutputChannel | AudiometryOutputChannel[];
  ToneDuration?: number;
  ToneRamp?: number;
  UseWavFile?: boolean;
  UseNthOctave?: boolean;
  OctaveBandSize?: number;
  FDev?: number;
  FDevForm?: AudiometryDevForm;
  FDevRate?: number;
}

export interface AudiometryResponseArea extends CommonResponseAreaInterface {
  repeatIfFailedOnce?: boolean;
  getNotesIfFailedTwice?: boolean;
  showMessageIfNoResponse?: boolean;
  noResponseCustomMessage?: string;
  hideExamProperties?: AudiometryHideExamProps; // TODO all these below
  plotProperties?: PlotProperties;
  measureBackground?: string;
  maskingNoise?: MaskingNoise;
}
