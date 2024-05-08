import { ProtocolErrorInterface } from "../../interfaces/protocol-error.interface";
import { ProtocolSchemaInterface } from "../../interfaces/protocol-schema.interface";
import { ProtocolServer } from "../../utilities/constants";

export interface ProtocolInterface extends ProtocolSchemaInterface {
    group?: string;
    name?: string;
    path?: string;
    id?: string;
    date?: string;
    version?: string;
    creator?: string;
    server?: ProtocolServer;
    admin?: boolean;
    contentURI?: string;
    key?: string;
    commonRepo?: any;
    protocolTabsintOutdated?: boolean;
    protocolUsbCMissing?: boolean;
    currentCalibration?: "VicFirth" | "VicFirthS2" | "HDA200" | "WAHTS" | "Audiometer" | "EPHD1" | "None" | undefined;
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