import { FollowOnsDictionary } from "../../interfaces/follow-ons-dictionary";
import { ProtocolDictionary } from "../../interfaces/protocol-dictionary";
import { ProtocolErrorInterface } from "../../interfaces/protocol-error.interface";
import { ProtocolSchemaInterface } from "../../interfaces/protocol-schema.interface";
import { ProtocolServer } from "../../utilities/constants";



export interface GitlabConfigInterface {
  host?: string | null;
  repository?: string | null;
  token?: string | null;
  group?: string | null;
  tag?: string | null;
}

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
}

export interface ProtocolModelInterface {
  activeProtocol?: ProtocolInterface, 
  activeProtocolDictionary?: ProtocolDictionary,
  activeProtocolFollowOnsDictionary?: FollowOnsDictionary
}
export interface ProtocolInterface extends ProtocolSchemaInterface, ProtocolMetaInterface {
    cCommon?: any;
    key?: string;
    commonRepo?: any;
    protocolTabsintOutdated?: boolean;
    protocolUsbCMissing?: boolean;
    currentCalibration?: "VicFirth" | "VicFirthS2" | "HDA200" | "WAHTS" | "Audiometer" | "EPHD1" | "None";
    _audioProfileVersion?: string;
    _calibrationPySVNRevision?: string;
    _calibrationPyManualReleaseDate?: string;
    _exportCSV?: boolean;
    _protocolIdDict?: any;
    _preProcessFunctionList?: Array<string>;
    _missingWavCalList?: Array<string>;
    _missingCommonWavCalList?: Array<string>;
    _missingPreProcessFunctionList?: Array<string>;
    _missingControllerList?: Array<string>;
    _missingHtmlList?: Array<string>; 
    _missingCommonMediaRepo?: boolean;
    _hasSubjectIdResponseArea?: boolean;
    _customHtmlList?: Array<{
        name: string,
        path: string,
        id: string
      }>;
    _requiresCha?: boolean;
    errors?: Array<ProtocolErrorInterface>
}