import { ProtocolInterface } from "../models/protocol/protocol.interface";
import { ProtocolErrorInterface } from "./protocol-error.interface";

export interface ProtocolSchema {
    description?: string;
    protocolId?: string;
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
    pages?: PageDefinition[];
    subProtocols?: ProtocolSchema[];
    lookUpTables?: { name: string; table: any[] }[];
}

export interface PageDefinition {
    id: string;
    headset?: "VicFirth" | "Vic Firth S2" | "HDA200" | "WAHTS" | "Audiometer" | "EPHD1" ;
    skipIf?: string;
    hideProgressBar?: boolean;
    autoSubmitDelay?: number;
    progressBarVal?: number | string;
    enableBackButton?: boolean;
    navMenu: NavMenuItem[];
    title?: string;
    subtitle?: string; // Deprecated
    spacing?: string; // Deprecated
    questionMainText?: string;
    questionSubText?: string;
    instructionText?: string;
    helpText?: string;
    resultMainText?: string; // Deprecated
    resultSubText?: string; // Deprecated
    repeatPage?: RepeatPage;
    preProcessFunction?: string;
    wavfileStartDelayTime?: number;
    wavfiles: Wavfile[];
    chaWavFiles: ChaWavfile[];
    chaStream?: boolean;
    image?: Image;
    video?: Video;
    responseArea?: ResponseArea;
    submitText?: string;
    followOns?: FollowOn[];
    setFlags?: SetFlag[];
    slm?: SLM;
    svantek?: boolean;
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

export interface NavMenuItem {
    // Assuming "/definitions/navMenu.json" defines the structure of a menu item
}
  
export interface RepeatPage {
    nRepeats: number;
    repeatIf?: string;
}

export interface Wavfile {
    useCommonRepo?: boolean;
    path: string;
    playbackMethod?: "arbitrary" | "as-recorded";
    targetSPL?: number | string;
    weighting?: "A" | "C" | "Z";
    startTime?: number;
    endTime?: number;
}

export interface ChaWavfile {
    Leq?: number[];
    path: string;
    SoundFileName?: string;
    useMetaRMS?: boolean;
    UseMetaRMS?: boolean; // Alternate key
}

export interface Image {
    path: string;
    width?: string;
}

export interface Video {
    path: string;
    width?: string;
    autoplay?: boolean;
    noSkip?: boolean;
}

export interface FollowOn {
    conditional: string;
    target: PageDefinition | ProtocolReference | ProtocolSchema;
}

export interface SetFlag {
    id: string;
    conditional: string;
}

export interface SLM {
    microphone: "internal" | "dayton" | "studio6";
    parameters: string[];
    ignoreResults?: string[];
}

export interface ProtocolReference {
    id?: string;
    reference: string;
    skipIf?: string;
}

export interface ResponseArea {
    [index: string]: any; // Define as per actual schema
}