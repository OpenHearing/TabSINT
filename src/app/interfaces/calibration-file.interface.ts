import { Headset, PlaybackMethod } from '../utilities/constants';

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
  tablet: string;

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
   * Real world root mean square Z value.
   */
  realWorldRMSZ?: number;

  /**
   * Scale factor for the wav file.
   */
  scaleFactor?: number;

  /**
   * Wav root mean square Z value.
   */
  wavRMSZ?: number;
}
