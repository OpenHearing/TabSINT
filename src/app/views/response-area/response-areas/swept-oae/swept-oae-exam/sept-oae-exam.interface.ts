import { CommonResponseAreaInterface } from "../../../../../interfaces/page-definition.interface";

export interface SweptOaeInterface extends CommonResponseAreaInterface {
    exportToCSV?: boolean;
    tabsintId?: string;
    f2Start?: number,
    f2End?: number,
    frequencyRatio?: number,
    sweepDuration?: number,
    windowDuration?: number,
    sweepType?: 'log' | 'linear',
    minSweeps?: number,
    maxSweeps?: number,
    noiseFloorThreshold?: number,
    showResults?: boolean
}