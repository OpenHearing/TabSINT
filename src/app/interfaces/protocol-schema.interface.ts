import { PageTypes } from "../types/custom-types";
import { CommonResponseAreaInterface, NavMenuInterface } from "./page-definition.interface";

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
    headset?: "VicFirth" | "VicFirthS2" | "HDA200" | "WAHTS" | "Audiometer" | "EPHD1";
    chaStream?: boolean;
    randomization?: "WithoutReplacement";
    minTabsintVersion?: string;
    commonMediaRepository?: string;
    calibration?: CalibrationInterface[];
    timeout?: TimeoutInterface;
    hideProgressBar?: boolean;
    enableBackButton?: boolean;
    navMenu?: NavMenuInterface[];
    js?: string[];
    pages: (PageTypes)[];
    subProtocols?: ProtocolSchemaInterface[];
}

export interface CalibrationInterface extends CommonResponseAreaInterface {
    wavfiles: string[];
    referenceFile?: string;
    referenceLevel?: number;
    calibrationFilter?: "full" | "flat";
}
  
export interface TimeoutInterface {
    nMaxSeconds?: number;
    nMaxPages?: number;
    showAlert?: boolean;
}
