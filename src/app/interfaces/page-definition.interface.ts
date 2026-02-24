import { CalibrationExamInterface } from '../views/response-area/response-areas/calibration-exam/calibration-exam-component/calibration-exam.interface';
import { PageTypes } from '../types/custom-types';
import { ManualAudiometryInterface } from '../views/response-area/response-areas/manual-audiometry/manual-audiometry.interface';
import { MultipleChoiceInterface } from '../views/response-area/response-areas/multiple-choice/multiple-choice.interface';
import { TextBoxResultViewerInterface } from '../views/response-area/response-areas/textbox-result-viewer/textbox-result-viewer.interface';
import { TextBoxInterface } from '../views/response-area/response-areas/textbox/textbox.interface';
import { MultipleInputInterface } from '../views/response-area/response-areas/multiple-input/multiple-input.interface';
import { LikertInterface } from '../views/response-area/response-areas/likert/likert/likert.interface';
import { SweptDpoaeInterface } from '../views/response-area/response-areas/swept-dpoae/swept-dpoae-exam/swept-dpoae-exam.interface';
import { WAIInterface } from '../views/response-area/response-areas/wideband-acoustic-immittance/wai-exam/wai-exam.interface';
import { MrtExamInterface } from '../views/response-area/response-areas/mrt/mrt-exam/mrt-exam.interface';
import { MemrExamInterface } from '../views/response-area/response-areas/memr/memr-exam/memr-exam.interface';
import { FPLCalibrationExamInterface } from '../views/response-area/response-areas/fpl-calibration-exam/fpl-calibration-exam-component/fpl-calibration-exam.interface';
import { CustomResponseAreaInterface } from '../views/response-area/response-areas/custom-response-area/custom-response-area.interface';
import { SubjectIdInterface } from '../views/response-area/response-areas/subject-id/subject-id.interface';
import { CheckboxInterface } from '../views/response-area/response-areas/checkbox/checkbox.interface';
import { PreProcessFunctionInterface } from './preProcessFunction.interface';
import { Headset, PlaybackMethod, WavfileWeighting } from '../utilities/constants';
import { ButtonGridInterface } from '../views/response-area/response-areas/button-grid/button-grid.interface';
import { QrCodeResponseAreaInterface } from '../views/response-area/response-areas/qr-code/qr-code.interface';

export interface PageDefinition {
  id: string;
  headset?: Headset;
  skipIf?: string;
  hideProgressBar?: boolean;
  autoSubmit?: boolean;
  autoSubmitDelay?: number;
  enableBackButton?: boolean;
  navMenu?: NavMenuInterface[];
  title?: string;
  questionPreMainText?: string;
  questionMainText?: string;
  questionSubText?: string;
  instructionText?: string;
  helpText?: string;
  repeatPage?: RepeatPageInterface;
  preProcessFunction?: PreProcessFunctionInterface;
  wavfileStartDelayTime?: number;
  wavfiles?: PageWavfileInterface[];
  chaWavFiles?: ChaWavfileInterface[];
  chaStream?: boolean;
  image?: ImageInterface;
  video?: VideoInterface;
  responseArea?: ResponseArea;
  submitText?: string;
  followOns?: FollowOnInterface[];
  setFlags?: SetFlagInterface[];
}

export interface NavMenuInterface {
  text: string;
  target: PageDefinition | ProtocolReferenceInterface;
  returnHereAfterward: boolean;
}

export interface RepeatPageInterface {
  nRepeats: number;
  repeatIf?: string;
}

export interface PageWavfileInterface {
  path: string;
  cal?: object;
  useCommonRepo?: boolean;
  playbackMethod?: PlaybackMethod;
  targetSPL?: number | string;
  weighting?: WavfileWeighting;
  startTime?: number;
  endTime?: number;
}

export interface ChaWavfileInterface {
  Leq?: number[];
  path: string;
  SoundFileName?: string;
  useMetaRMS?: boolean;
  UseMetaRMS?: boolean; // Alternate key
}

export interface ImageInterface {
  path: string;
  width?: string;
  b64?: string;
}

export interface VideoInterface {
  path: string;
  width?: string;
  autoplay?: boolean;
  noSkip?: boolean;
}

export interface FollowOnInterface {
  conditional: string;
  target: PageTypes;
}

export interface ProtocolReferenceInterface {
  id?: string;
  reference: string;
  skipIf?: string;
}

export interface SetFlagInterface {
  id: string;
  conditional: string;
}

export interface CommonResponseAreaInterface {
  enableSkip?: boolean;
  type: string;
  responseRequired?: boolean;
}

export type ResponseArea =
  | TextBoxInterface
  | TextBoxResultViewerInterface
  | SubjectIdInterface
  | CheckboxInterface
  | ButtonGridInterface
  | MultipleChoiceInterface
  | ManualAudiometryInterface
  | CalibrationExamInterface
  | FPLCalibrationExamInterface
  | MultipleInputInterface
  | LikertInterface
  | SweptDpoaeInterface
  | WAIInterface
  | MrtExamInterface
  | MemrExamInterface
  | CustomResponseAreaInterface
  | QrCodeResponseAreaInterface;
