import { PageTypes } from "../types/custom-types";
import { MultipleChoiceInterface} from "../views/response-area/response-areas/multiple-choice/multiple-choice.interface";
import { TextBoxInterface } from "../views/response-area/response-areas/textbox/textbox.interface";

export interface PageDefinition {
    id: string;
    headset?: "VicFirth" | "Vic Firth S2" | "HDA200" | "WAHTS" | "Audiometer" | "EPHD1" ;
    skipIf?: string;
    hideProgressBar?: boolean;
    autoSubmitDelay?: number;
    enableBackButton?: boolean;
    navMenu?: NavMenuInterface[];
    title?: string;
    questionMainText?: string;
    questionSubText?: string;
    instructionText?: string;
    helpText?: string;
    repeatPage?: RepeatPageInterface;
    preProcessFunction?: string;
    wavfileStartDelayTime?: number;
    wavfiles?: WavfileInterface[];
    chaWavFiles?: ChaWavfileInterface[];
    chaStream?: boolean;
    image?: ImageInterface;
    video?: VideoInterface;
    responseArea?: ResponseArea;
    submitText?: string;
    followOns?: FollowOnInterface[];
    setFlags?: SetFlagInterface[];
}
  
export interface NavMenuInterface {
    text: string;
    target: PageDefinition | ProtocolReferenceInterface;
    returnHereAfterward: boolean;
}
  
export interface RepeatPageInterface {
    nRepeats: number;
    repeatIf?: string;
}

export interface WavfileInterface {
    cal: object;
    useCommonRepo?: boolean;
    path: string;
    playbackMethod?: "arbitrary" | "as-recorded";
    targetSPL?: number | string;
    weighting?: "A" | "C" | "Z";
    startTime?: number;
    endTime?: number;
}

export interface ChaWavfileInterface {
    Leq?: number[];
    path: string;
    SoundFileName?: string;
    useMetaRMS?: boolean;
    UseMetaRMS?: boolean; // Alternate key
}

export interface ImageInterface {
    path: string;
    width?: string;
}

export interface VideoInterface {
    path: string;
    width?: string;
    autoplay?: boolean;
    noSkip?: boolean;
}

export interface FollowOnInterface {
    conditional: string;
    target: PageTypes;
}

export interface ProtocolReferenceInterface {
    id?: string;
    reference: string;
    skipIf?: string;
}

export interface SetFlagInterface {
    id: string;
    conditional: string;
}

export interface CommonResponseArea {
    enableSkip?: boolean;
    type: string;
    responseRequired?: boolean;
}

export type ResponseArea =
    TextBoxInterface |
    MultipleChoiceInterface;