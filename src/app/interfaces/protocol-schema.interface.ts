import { NavMenuItem, PageDefinition, ProtocolReference } from "./page-definition.interface";

export interface ProtocolSchemaInterface {
    description?: string;
    protocolId: string;
    resultFilename?: string;
    publicKey?: string;
    title?: string;
    subtitle?: string;
    instructionText?: string;
    helpText?: string;
    submitText?: string;
    tablet?: string; // Deprecated
    headset?: "VicFirth" | "VicFirthS2" | "HDA200" | "WAHTS" | "Audiometer" | "EPHD1";
    chaStream?: boolean;
    randomization?: "WithoutReplacement";
    minTabsintVersion?: string;
    commonMediaRepository?: string;
    calibration?: Calibration[];
    timeout?: Timeout;
    hideProgressBar?: boolean;
    enableBackButton?: boolean;
    navMenu?: NavMenuItem[];
    js?: string | string[];
    exclusiveTimingMode?: boolean;
    pages: PageDefinition | ProtocolReference | ProtocolSchemaInterface | (PageDefinition | ProtocolReference | ProtocolSchemaInterface)[];
    subProtocols?: ProtocolSchemaInterface[];
    lookUpTables?: { name: string; table: any[] }[];
}

export interface Calibration {
    wavfiles: string[];
    referenceFile?: string;
    referenceLevel?: number;
    calibrationFilter?: "full" | "flat";
}
  
export interface Timeout {
    nMaxSeconds?: number;
    nMaxPages?: number;
    showAlert?: boolean;
}
