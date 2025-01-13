import { CommonResponseAreaInterface } from "../../../../../interfaces/page-definition.interface";


export interface CalibrationExamInterface extends CommonResponseAreaInterface {
    exportToCSV?: boolean;
    tabsintId?: string;
    frequencies?: number[];
    targetLevels?: number[];
    responseRequired?: boolean
    showResults?: boolean
}

export interface CalibrationResultViewerInterface extends CommonResponseAreaInterface {
    displayRightEar: boolean;
    displayLeftEar: boolean;
}

export interface EarData {
    calFactor: number;
    measurement: string | number;
    maxOutput: string | number;
}
  
export interface ExamResponse {
    pageId: string;
    response: string;
    responseArea: string;
}