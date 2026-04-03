import { IDevice } from '../../interfaces/devices/device.interface';
import { ITympanDevice } from '../../interfaces/devices/tympan-device.interface';
import { IWahtsDevice } from '../../interfaces/devices/wahts-device.interface';
import { IDuodoseDevice } from '../../interfaces/devices/duodose-device.interface';
import { MediaReposInterface } from '../../interfaces/media-repos.interface';
import { Preferences } from '../../interfaces/preferences.interface';
import { ProtocolServer } from '../../utilities/constants';
import { ProtocolMetaInterface } from '../protocol/protocol.interface';

export interface GitlabConfigInterface {
  host: string;
  repository: string;
  token: string;
  group: string;
  tag: string;
}

export interface DiskInterface {
  activeProtocolMeta?: ProtocolMetaInterface;
  appDeveloperModeCount: number;
  audhere: string;
  availableProtocolsMeta: {
    [Key: string]: ProtocolMetaInterface;
  };
  contentURI: string | null;
  downloadInProgress: boolean;
  interApp: {
    appName: string;
    dataIn: string;
    dataOut: string;
  };
  lastReleaseCheck: string;
  mediaRepos: MediaReposInterface[];
  numLogRows: number;
  reloadingBrowser: boolean;
  tabletLocation: {
    accuracy?: number;
    latitude?: number;
    longitude?: number;
  };
  uploadSummary: UploadSummary[];
  savedDevices: SavedDevice[];
  showDisclaimer: boolean;
  preferences: Preferences;
}

export interface UploadSummary {
  protocolId?: string;
  protocolName: string;
  testDateTime: string;
  nResponses: number;
  source: ProtocolServer;
  uploadedOn: string;
  output: ProtocolServer;
}

export type SavedDevice = IDevice | IWahtsDevice | ITympanDevice | IDuodoseDevice;
