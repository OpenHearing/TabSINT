import { CalibrationFilter, Headset, PlaybackMethod, Tablet } from '../utilities/constants';

/**
 * Interface for calibration.json files which are provided with a protocol.
 */
export interface CalibrationFileInterface extends CalibrationFileVersionInformation {
  /**
   * The type of headset associated with the calibration.
   */
  headset: Headset;

  /**
   * The type of tablet associated with the calibration.
   */
  tablet: Tablet;

  /**
   * Index signature for mapping wav files to calibration wav file properties.
   * Including all other property types used in the interface is required.
   */
  [key: string]: string | number | CalibrationFileWavProperties;
}

/**
 * Interface for version properties in the calibration file.
 */
export interface CalibrationFileVersionInformation {
  /**
   * Audio profile version.
   */
  audioProfileVersion: string;

  /**
   * Calibration information related to SVN.
   */
  calibrationPySVNRevision: string;

  /**
   * Calibration information related to release date.
   */
  calibrationPyManualReleaseDate: string | number;
}

/**
 * Interface for properties in the calibration file specific for each specified wav file.
 */
export interface CalibrationFileWavProperties {
  /**
   * The playback method reference type.
   */
  refType?: PlaybackMethod;

  /**
   * The filtering mode which the calibration used
   */
  calibrationFilter?: CalibrationFilter;

  /**
   * RMS output for a 1 kHz full scale input (Pa^-1).
   */
  scaleFactor?: number;

  /**
   * The cumulative normalization factor for all scaling.
   */
  normFactor?: number;

  /**
   * A-weighted RMS of input signal multiplied by a calibration factor based on the reference file.
   */
  realWorldRMSA?: number;

  /**
   * C-weighted RMS of input signal multiplied by a calibration factor based on the reference file.
   */
  realWorldRMSC?: number;

  /**
   * Z-weighted RMS of input signal multiplied by a calibration factor based on the reference file.
   */
  realWorldRMSZ?: number;

  /**
   * A-weighted RMS of input signal multiplied by the norm factor.
   */
  wavRMSA?: number;

  /**
   * C-weighted RMS of input signal multiplied by the norm factor.
   */
  wavRMSC?: number;

  /**
   * Z-weighted RMS of input signal multiplied by the norm factor.
   */
  wavRMSZ?: number;

  /**
   * A-weighted RMS of input signal.
   */
  RMSA?: number;

  /**
   * C-weighted RMS of input signal.
   */
  RMSC?: number;

  /**
   * Z-weighted RMS of input signal.
   */
  RMSZ?: number;
}
