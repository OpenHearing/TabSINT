import { ProtocolMetaInterface, ProtocolInterface } from '../models/protocol/protocol.interface';
import { CalibrationFileInterface } from './calibration-file.interface';

export interface LoadingProtocolInterface {
  protocol: ProtocolInterface;
  calibration?: CalibrationFileInterface;
  meta: ProtocolMetaInterface;
  notify: boolean;
  overwrite: boolean;
}
