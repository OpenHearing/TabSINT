import { CommonResponseAreaInterface } from "../../../../interfaces/page-definition.interface";

export interface ManualAudiometryInterface extends CommonResponseAreaInterface {
    exportToCSV?: boolean;
    tabsintId?: string;
    maxOutputLevel?: number;
    minOutputLevel?: number;
    currentDbSpl?: number; 
    frequencies?: number[];  
    adjustments?: number[];
    retspls?: number[];
    showResults?: boolean;
}