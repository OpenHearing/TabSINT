import { MultipleChoiceInterface} from "../views/response-area/response-areas/multiple-choice/multiple-choice.interface";
import { TextBoxInterface } from "../views/response-area/response-areas/textbox/textbox.interface";
import { ProtocolSchemaInterface } from "./protocol-schema.interface";

export interface PageDefinition {
    type: string,
    id: string;
    headset?: "VicFirth" | "Vic Firth S2" | "HDA200" | "WAHTS" | "Audiometer" | "EPHD1" ;
    skipIf?: string;
    hideProgressBar?: boolean;
    autoSubmitDelay?: number;
    progressBarVal?: number | string;
    enableBackButton: boolean;
    navMenu?: NavMenuItem[];
    title: string;
    questionMainText: string;
    questionSubText: string;
    instructionText: string;
    helpText: string;
    repeatPage?: RepeatPage;
    preProcessFunction?: string;
    wavfileStartDelayTime?: number;
    wavfiles?: Wavfile[];
    chaWavFiles?: ChaWavfile[];
    chaStream?: boolean;
    image?: Image;
    video?: Video;
    responseArea: ResponseArea;
    submitText: string;
    followOns: FollowOn[];
    setFlags?: SetFlag[];
    slm?: SLM;
    svantek?: boolean;
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
    target: PageDefinition | ProtocolReference | ProtocolSchemaInterface;
}

export interface ProtocolReference {
    id?: string;
    reference: string;
    skipIf?: string;
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

export interface CommonResponseArea {
    enableSkip: boolean;
    type: string;
    responseRequired: boolean;
}

export interface ResponseArea extends 
    CommonResponseArea, 
    TextBoxInterface,
    MultipleChoiceInterface {}