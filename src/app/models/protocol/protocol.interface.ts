import { CalibrationFileInterface } from '../../interfaces/calibration-file.interface';
import { FollowOnsDictionary } from '../../interfaces/follow-ons-dictionary';
import { MediaReposInterface } from '../../interfaces/media-repos.interface';
import { ProtocolDictionary } from '../../interfaces/protocol-dictionary';
import { ProtocolErrorInterface } from '../../interfaces/protocol-error.interface';
import { ProtocolSchemaInterface } from '../../interfaces/protocol-schema.interface';
import { Headset, ProtocolServer } from '../../utilities/constants';
import { GitlabConfigInterface } from '../disk/disk.interface';
import { ProtocolStack } from './protocol-stack';

export interface ProtocolMetaInterface {
  group?: string;
  name: string;
  path?: string;
  date: string;
  version: string;
  creator?: string;
  server: ProtocolServer;
  admin: boolean;
  contentURI?: string | null;
  gitlabConfig?: GitlabConfigInterface;
  publicKey?: string;
}

export interface ProtocolModelInterface {
  activeProtocol?: ProtocolInterface;
  activeProtocolStack: ProtocolStack;
  activeProtocolDictionary?: ProtocolDictionary;
  activeProtocolFollowOnsDictionary?: FollowOnsDictionary;
}
export interface ProtocolInterface extends ProtocolSchemaInterface, ProtocolMetaInterface {
  key?: string;
  commonRepo?: MediaReposInterface;
  cCommon?: CalibrationFileInterface;
  protocolTabsintOutdated?: boolean;
  protocolUsbCMissing?: boolean;
  currentCalibration?: Headset;
  _audioProfileVersion?: string;
  _calibrationPySVNRevision?: string;
  _calibrationPyManualReleaseDate?: string;
  _exportCSV?: boolean;
  _protocolIdDict?: Record<string, ProtocolSchemaInterface>;
  _missingWavCalList?: string[];
  _missingCommonWavCalList?: string[];
  _missingControllerList?: string[];
  _missingHtmlList?: string[];
  _missingCommonMediaRepo?: boolean;
  _hasSubjectIdResponseArea?: boolean;
  _customHtmlList?: {
    name: string;
    path: string;
    id: string;
  }[];
  _requiresCha?: boolean;
  errors?: ProtocolErrorInterface[];
}
