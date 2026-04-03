import { CalibrationFileVersionInformation } from '../../interfaces/calibration-file.interface';
import { IDeviceMetadata } from '../../interfaces/devices/device-metadata.interface';
import { DosimetryResultsInterface } from '../../interfaces/dosimeter-results.interface';
import { ChaWavfileInterface, ImageInterface, VideoInterface, PageWavfileInterface, ResponseArea } from '../../interfaces/page-definition.interface';
import { ProtocolServer } from '../../utilities/constants';
import { ProtocolInterface } from '../protocol/protocol.interface';
import { VersionInterface } from '../version/version.interface';
import { FlagsInterface } from './flags.interface';

export interface ResultsInterface {
  currentPage: CurrentResults;
  currentExam: ExamResults;
}

export interface CurrentResults {
  pageId: string;
  response?: any;
  correct?: boolean;
  eachCorrect?: boolean[];
  numberCorrect?: number;
  numberIncorrect?: number;
  isSkipped?: boolean;
  responseArea?: string;
  page: {
    wavfiles?: PageWavfileInterface[];
    chaWavFiles?: ChaWavfileInterface[];
    image?: ImageInterface;
    video?: VideoInterface;
    responseArea?: ResponseArea;
  };
  dosimetry?: DosimetryResultsInterface;
}

export interface ExamResults {
  protocol: ProtocolInterface;
  testDateTime?: string;
  elapsedTime?: string;
  exportLocation?: ProtocolServer;
  responses: any;
  partialresults?: any;
  softwareVersion: VersionInterface;
  tabletLocation: {
    latitude?: number;
    longitude?: number;
    accuracy?: number;
  };
  calibrationVersion: Partial<CalibrationFileVersionInformation>;
  hostMetadata: IDeviceMetadata;
  devices: string[];
  flags: FlagsInterface;
  qrString?: string;
}
