import { CalibrationExamInterface } from "../views/response-area/response-areas/calibration-exam/calibration-exam-component/calibration-exam.interface";
import { PageTypes } from "../types/custom-types";
import { ManualAudiometryInterface } from "../views/response-area/response-areas/manual-audiometry/manual-audiometry.interface";
import { MultipleChoiceInterface } from "../views/response-area/response-areas/multiple-choice/multiple-choice.interface";
import { TextBoxResultViewerInterface } from "../views/response-area/response-areas/textbox-result-viewer/textbox-result-viewer.interface";
import { TextBoxInterface } from "../views/response-area/response-areas/textbox/textbox.interface";
import { MultipleInputInterface } from "../views/response-area/response-areas/multiple-input/multiple-input.interface";
import { LikertInterface } from "../views/response-area/response-areas/likert/likert/likert.interface";
import { SweptDpoaeInterface } from "../views/response-area/response-areas/swept-dpoae/swept-dpoae-exam/swept-dpoae-exam.interface";
import { WAIInterface } from "../views/response-area/response-areas/wideband-acoustic-immittance/wai-exam/wai-exam.interface";

export interface PageDefinition {
    id: string;
    headset?: "VicFirth" | "Vic Firth S2" | "HDA200" | "WAHTS" | "Audiometer" | "EPHD1";
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

export interface CommonResponseAreaInterface {
    enableSkip?: boolean;
    type: string;
    responseRequired?: boolean;
}

export type ResponseArea =
    TextBoxInterface | TextBoxResultViewerInterface |
    MultipleChoiceInterface | ManualAudiometryInterface | CalibrationExamInterface |
    MultipleInputInterface | LikertInterface | SweptDpoaeInterface | WAIInterface