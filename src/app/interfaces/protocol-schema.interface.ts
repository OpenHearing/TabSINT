import { PageTypes } from '../types/custom-types';
import { CalibrationFilter, Headset } from '../utilities/constants';
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
  headset?: Headset;
  chaStream?: boolean;
  randomization?: 'WithoutReplacement';
  minTabsintVersion?: string;
  commonMediaRepository?: string;
  calibration?: ProtocolCalibrationInterface[];
  timeout?: TimeoutInterface;
  hideProgressBar?: boolean;
  enableBackButton?: boolean;
  navMenu?: NavMenuInterface[];
  js?: string[];
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
