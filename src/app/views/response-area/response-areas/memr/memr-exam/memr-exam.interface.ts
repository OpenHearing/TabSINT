import { CommonResponseAreaInterface } from "../../../../../interfaces/page-definition.interface";

/**
 * MEMR Exam Interface
 * 
 * @extends {CommonResponseAreaInterface}
 * 
 * @field tabsintId Id of the device for the exam to be queued to.
 * @field exportToCSV If true, export the results to a CSV.
 * @field soundFileName Path of the wav file to play on the Tympan, including a directory.
 * @field recordFileName Path of the WAV file to record, including a directory.
 * @field nRepeats Number of repeats at the trial or block level.
 * @field useMetaRMS If true, read the metadata scalar from the wav file and apply the gain.
 * @field elicitorLevelChange String determining if the change should be within block or between blocks (Enum: "Within Block" or "Between Blocks").
 * @field elicitorLevelArray Elicitor level changes for each trial or block (also determines the number of trials or blocks). 
 * @field probeStimulusLevel The probe stimulus level.
 * @field submissionIntervalMs The wait period after completing all trials, in milliseconds.
 * @field probeOutputChannel The output channel for the exam.
 * @field elicitorOutputChannel The input channel for the exam.
 */
export interface MemrExamInterface extends CommonResponseAreaInterface {
  tabsintId?: string;
  exportToCSV?: boolean;
  soundFileName?: string;
  recordFileName?: string;
  nRepeats?: number;
  useMetaRMS?: boolean;
  elicitorLevelChange?: string;
  elicitorLevelArray?: number[][];
  probeStimulusLevel?: number;
  submissionIntervalMs?: number;
  probeOutputChannel?: string;
  elicitorOutputChannel?: string;
}

/**
 * MEMR Queue Exam Interface
 * 
 * @field OutputChannel The probe channel for the exam.
 * @field InputChannel The elicitor channel for the exam.
 */
export interface MemrQueueExamInterface {
  OutputChannel?: string;
  InputChannel?: string;
}

/**
 * MEMR Exam Submission Interface
 * 
 * @field SoundFileName Path of the wav file to play on the Tympan, including a directory.
 * @field RecordFileName Path of the WAV file to record, including a directory.
 * @field NumTrials Number of repeats at the trial or block level.
 * @field UseMetaRMS If true, read the metadata scalar from the wav file and apply the gain.
 * @field elicitorLevelChange String determining if the change should be within block or between blocks (Enum: "Within Block" or "Between Blocks").
 * @field Level_dBSpl Elicitor level changes for each trial or block (also determines the number of trials or blocks). 
 * @field probeStimulusLevel The probe stimulus level.
 * @field SubmissionInterval_ms The wait period after completing all trials, in milliseconds.
 * @field ProbStimulusLevel The probe stimulus level.
 * @field ElicitorLevelChange determining if the change should be within block or between blocks (Enum: "Within Block" or "Between Blocks").
 * 
 */
export interface MemrExamSubmissionInterface {
  SoundFileName?: string;
  RecordFileName?: string;
  NumTrials?: number;
  UseMetaRMS?: boolean;
  Level_dBSpl?: number[][];
  probeStimulusLevel?: number;
  SubmissionInterval_ms?: number;
  ProbStimulusLevel?: number;
  ElicitorLevelChange?: string;
}

/**
 * MEMR Results Interface

 * 
 * @field State The state of the exam ("OFF", "READY", "PLAYING").
 * @field NumTrialsComplete Number of completed trials for the exam.
 * @field RecordedLevel_LeqdBSPL Equivalent sound levels of each output channel for the last completed trial.
 * @field RecordedLevel_dBP Peak sound level of each output channel for the last completed trial.
 */
export interface MemrResultsInterface {
  State: string;
  NumTrialsComplete: number;
  RecordedLevel_LeqdBSPL: number;
  RecordedLevel_dBP: number;
}