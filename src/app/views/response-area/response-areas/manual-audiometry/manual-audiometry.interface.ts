import { RetsplsInterface } from "../../../../interfaces/audiometry-results.interface";
import { CommonResponseAreaInterface } from "../../../../interfaces/page-definition.interface";
export interface ManualAudiometryInterface extends CommonResponseAreaInterface {
    exportToCSV?: boolean;
    tabsintId?: string;
    maxOutputLevel?: number;
    minOutputLevel?: number;
    targetLevelInLevelUnits?: number; 
    levelUnits?: string;
    frequencies?: number[];  
    adjustmentStepSize?: 2|3|4|5;
    incrementRatioMultiplier?: 1|2;
    retspls?: RetsplsInterface;
    showResults?: boolean;
}