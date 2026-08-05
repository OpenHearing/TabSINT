import { CalibrationFileVersionInformation } from '../../interfaces/calibration-file.interface';
import { IDeviceMetadata } from '../../interfaces/devices/device-metadata.interface';
import { IDevice } from '../../interfaces/devices/device.interface';
import { DosimetryResultsInterface } from '../../interfaces/dosimeter-results.interface';
import { SvantekResultInterface } from '../../interfaces/svantek-result.interface';
import { ProtocolServer } from '../../utilities/constants';
import { ProtocolInterface } from '../protocol/protocol.interface';
import { VersionInterface } from '../version/version.interface';
import { FlagsInterface } from './flags.interface';
import { PageInterface } from '../page/page.interface';

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
  responseStartTime?: string;
  responseElapTimeMS?: number;
  page: Partial<PageInterface>;
  dosimetry?: DosimetryResultsInterface;
  svantek?: SvantekResultInterface;
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
  devices: Partial<IDevice>[];
  flags: FlagsInterface;
  qrString?: string;
}
