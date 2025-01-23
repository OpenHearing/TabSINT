import { CommonResponseAreaInterface } from "../../../../../interfaces/page-definition.interface";

export interface MrtExamInterface extends CommonResponseAreaInterface {
    exportToCSV?: boolean;
    tabsintId?: string;
    examDefinitionFilename: string;
    numWavChannels?: number;
    outputChannel?: string[];
    trialList?: MrtTrialInterface[];
    showResults?: boolean
}

export interface MrtTrialInterface {
  filename: string;
  leveldBSpl: number;
  useMeta: boolean;
  choices: string[];
  answer: number;
  SNR: number;
}

export interface MrtTrialResultInterface  {
  filename: string,
  leveldBSpl: number;
  useMeta: boolean;
  choices: string[];
  answer: number;
  SNR: number;
  userResponseIndex: number;
  isCorrect: boolean;
}
export interface MrtResultsInterface {
  snr: number;
  nbTrials: number;
  nbTrialsCorrect: number;
  pctCorrect: number;
  trialList: MrtTrialResultInterface[]
}