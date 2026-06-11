import { PageTypes } from '../types/custom-types';
import { CalibrationFilter } from '../utilities/constants';
import { NavMenuInterface } from './page-definition.interface';

export interface ProtocolSchemaInterface {
  description?: string;
  protocolId?: string;
  resultFilename?: string;
  publicKey?: string;
  title?: string;
  subtitle?: string;
  instructionText?: string;
  helpText?: string;
  submitText?: string;
  chaStream?: boolean;
  randomization?: 'WithoutReplacement';
  commonMediaRepository?: string;
  calibration?: ProtocolCalibrationInterface[];
  timeout?: TimeoutInterface;
  hideProgressBar?: boolean;
  enableBackButton?: boolean;
  navMenu?: NavMenuInterface[];
  pages: PageTypes[];
  subProtocols?: ProtocolSchemaInterface[];
}
export interface ProtocolCalibrationInterface {
  wavfiles: string[];
  referenceFile?: string;
  referenceLevel?: number;
  calibrationFilter?: CalibrationFilter;
}

export interface TimeoutInterface {
  nMaxSeconds?: number;
  nMaxPages?: number;
  showAlert?: boolean;
}
