import { RetsplsInterface } from "../../../../interfaces/audiometry-results.interface";
import { CommonResponseAreaInterface } from "../../../../interfaces/page-definition.interface";
export interface ManualAudiometryInterface extends CommonResponseAreaInterface {
    exportToCSV?: boolean;
    tabsintId?: string;
    maxOutputLevel?: number;
    minOutputLevel?: number;
    targetLevel?: number; 
    levelUnits?: string;
    frequencies?: number[];  
    adjustments?: number[];
    retspls?: RetsplsInterface;
    showResults?: boolean;
}