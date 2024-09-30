import { CommonResponseAreaInterface } from "../../../../interfaces/page-definition.interface";

export interface ManualAudiometryInterface extends CommonResponseAreaInterface {
    exportToCSV?: boolean;
    maxOutputLevel?: number;
    minOutputLevel?: number;
    currentDbSpl?: number; 
    frequencies?: number[];  
    adjustments?: number[];
}