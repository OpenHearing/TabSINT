import { GitlabConfigInterface } from '../models/disk/disk.interface';
import { BluetoothType, Headset, ProtocolServer, ResultsMode } from '../utilities/constants';

/**
 * Preferences which are stored on a device and shareable between users.
 */
export interface Preferences {
  adminSkipMode: boolean;
  appDeveloperMode: boolean;
  autoUpload: boolean;
  debugMode: boolean;
  disableAudioStreaming?: boolean;
  disableLogs: boolean;
  disableVolume: boolean;
  externalMode: boolean;
  gitlab: {
    repos: string[];
    useSeperateResultsRepo: boolean;
    useTagsOnly: boolean;
  };
  gitlabConfig: GitlabConfigInterface;
  headset: Headset;
  language: string;
  maxLogRows: number;
  pin: string;
  preventExports: boolean;
  preventUploads: boolean;
  requireEncryptedResults: boolean;
  resultsMode: ResultsMode;
  server: ProtocolServer;
  servers: {
    gitlab: {
      group?: string;
      host?: string;
      resultsGroup?: string;
      resultsRepo: string;
      repository?: string;
      token?: string;
      version?: string;
    };
    localServer: {
      protocolDir: string;
      resultsDir: string;
      resultsDirUri: string;
    };
  };
  showUploadSummary: boolean;
  suppressAlerts: boolean;
  tabletGain: number;
  validateProtocols: boolean;
  versionCheck: boolean;
  wahtsConnectionType: BluetoothType;
  recordTestLocation?: boolean;
  ignoreFirmwareUpdates: boolean;
  showTympanPanel?: boolean;
  showWahtsPanel?: boolean;
  showDuodosePanel?: boolean;
  enableHeadsetMediaManagement?: boolean;
}
