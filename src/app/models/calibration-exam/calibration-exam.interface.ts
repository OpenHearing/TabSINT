import { CommonResponseAreaInterface } from "../../interfaces/page-definition.interface";


export interface CalibrationExamInterface extends CommonResponseAreaInterface{
    exportToCSV?: boolean;
    tabsintId?: string;
    frequencies?: number[];
    targetLevels?:number[];
    responseRequired?:boolean
}