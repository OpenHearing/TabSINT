import { CommonResponseAreaInterface } from "../../../../../interfaces/page-definition.interface";

export interface MrtExamInterface extends CommonResponseAreaInterface {
    exportToCSV?: boolean;
    tabsintId?: string;
    examDefinitionFilename: string;
    numWavChannels: number;
    outputChannel: string | string[];
    presentationList: MrtPresentationInterface[];
    showResults?: boolean
}

export interface MrtPresentationInterface {
  filename: string;
  leveldBSpl: number;
  useMeta: boolean;
  responseChoices: string[];
  correctResponseIndex: number;
}

export interface MrtResultsInterface {
  snr: number;
  nbTrials: number;
  nbTrialsCorrect: number;
  pctCorrect: number;
}