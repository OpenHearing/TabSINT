import { CommonResponseArea } from "../../../../interfaces/page-definition.interface";

export interface ManualAudiometryInterface extends CommonResponseArea {
    exportToCSV?: boolean;
    maxOutputLevel?: number;
    minOutputLevel?: number;
    currentDbSpl?: number; 
    frequencies?: number[];  
    adjustments?: number[];
}