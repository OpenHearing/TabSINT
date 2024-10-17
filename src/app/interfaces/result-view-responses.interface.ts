import { CommonResponseAreaInterface } from "../interfaces/page-definition.interface";

export interface ResultViewerResponseAreaInterface extends CommonResponseAreaInterface {
    pageIdsToDisplay: string[];
}

export interface ResultViewResponsesInterface {
    title?: string;
    questionMainText?: string;
    questionSubText?: string;
    instructionText?: string;
    response?: string;
}
