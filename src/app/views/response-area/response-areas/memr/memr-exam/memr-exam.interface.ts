import { CommonResponseAreaInterface } from '../../../../../interfaces/page-definition.interface';

/**
 * MEMR Exam Interface
 *
 * @extends {CommonResponseAreaInterface}
 *
 * @field tabsintId Id of the device for the exam to be queued to.
 * @field exportToCSV If true, export the results to a CSV.
 * @field soundFileName Path of the wav file to play on the Tympan, including a directory.
 * @field recordFileFolder Folder name on the tympan where recorded sound files are stored.
 * @field nRepeats Number of repeats at the trial or block level.
 * @field useMetaRMS If true, read the metadata scalar from the wav file and apply the gain.
 * @field elicitorLevelChange String determining if the change should be within block or between blocks (Enum: "Within Block" or "Between Blocks").
 * @field elicitorLevelArray Elicitor level changes for each trial or block (also determines the number of trials or blocks).
 * @field probeStimulusLevel The probe stimulus level.
 * @field submissionIntervalMs The wait period after completing all trials, in milliseconds.
 * @field probeOutputChannel The output channels for the exam.
 * @field elicitorOutputChannel The input channels for the exam.
 */
export interface MemrExamInterface extends CommonResponseAreaInterface {
  tabsintId?: string;
  exportToCSV?: boolean;
  soundFileName?: string;
  recordFileFolder?: string;
  nRepeats?: number;
  useMetaRMS?: boolean;
  elicitorLevelChange?: string;
  elicitorLevelArray?: number[];
  probeStimulusLevel?: number;
  submissionIntervalMs?: number;
  probeOutputChannel?: string[];
  elicitorOutputChannel?: string[];
  recordChannels?: string[];
  bleDelayPerTrial?: number;
  autoSubmit?: boolean;
}

/**
 * MEMR Queue Exam Interface
 *
 * @field RecordChannels The probe channels for the exam.
 * @field PlaybackChannels The elicitor channels for the exam.
 */
export interface MemrQueueExamInterface {
  RecordChannels?: string[];
  PlaybackChannels?: string[];
}

/**
 * MEMR Exam Submission Interface
 *
 * @field SoundFileName Path of the wav file to play on the Tympan, including a directory.
 * @field RecordFileName Path of the WAV file to record, including a directory.
 * @field NumTrials Number of trials in a block.
 * @field UseMetaRMS If true, read the metadata scalar from the wav file and apply the gain.
 * @field Level_dBSpl Elicitor level changes for the block.
 * @field SubmissionInterval_ms The wait period after completing all trials, in milliseconds.
 *
 */
export interface MemrExamSubmissionInterface {
  SoundFileName?: string;
  RecordFileName?: string;
  NumTrials?: number;
  UseMetaRMS?: boolean;
  Level_dBSpl?: number[][];
  SubmissionInterval_ms?: number;
  NumOutputChans?: number;
}

/**
 * MEMR Results Interface

 * 
 * @field State The state of the exam ("OFF", "READY", "PLAYING").
 * @field TrialsCompleted Number of completed trials for the exam.
 * @field RecordedLevel_LeqdBSPL Equivalent sound levels of each output channel for the last completed trial.
 * @field RecordedLevel_dBP Peak sound level of each output channel for the last completed trial.
 */
export interface MemrResultsInterface {
  State: string;
  TrialsCompleted: number;
  RecordedLeq_dBSPL: number;
  RecordedPeak_dBP: number;
}
