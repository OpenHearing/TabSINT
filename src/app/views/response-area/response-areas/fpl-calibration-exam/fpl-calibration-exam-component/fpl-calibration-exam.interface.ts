import { CommonResponseAreaInterface } from "../../../../../interfaces/page-definition.interface";


export interface FPLCalibrationExamInterface extends CommonResponseAreaInterface {
    exportToCSV?: boolean;
    tabsintId?: string;
    outputChannels: string[];
    fStart?: number,
    fEnd?: number,
    sweepDuration?: number,
    windowDuration?: number,
    numFrequencies?: number,
    responseRequired?: boolean;
    showResults?: boolean;
}

