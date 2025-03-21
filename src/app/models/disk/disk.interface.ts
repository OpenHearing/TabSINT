import { MediaReposInterface } from "../../interfaces/media-repos.interface"
import { ProtocolServer, ResultsMode } from "../../utilities/constants"
import { ProtocolMetaInterface } from "../protocol/protocol.interface"

export interface DiskInterface {
  activeProtocolMeta?: ProtocolMetaInterface,
  adminSkipMode: boolean,
  appDeveloperMode: boolean,
  appDeveloperModeCount: number,
  audhere: string,
  autoUpload: boolean,
  availableProtocolsMeta: {
      [Key: string]: ProtocolMetaInterface
  },
  cha: {
      bluetoothType: string,
      embeddedFirmwareBuildDate: string,
      embeddedFirmwareTag: string,
      myCha: string
  },
  contentURI: string | null,
  debugMode: boolean,
  disableAudioStreaming?: boolean,
  disableLogs: boolean,
  disableVolume?: boolean,
  downloadInProgress: boolean,
  externalMode: boolean,
  extStorageRootDir?: string,
  extStorageUuidDir?: string,
  gitlab: {
      repos: Array<string>,
      useSeperateResultsRepo: boolean,
      useTagsOnly: boolean
  },
  headset: string,
  interApp: {
      appName: string,
      dataIn: string,
      dataOut: string
  },
  language: string,
  lastReleaseCheck: string,
  mediaRepos: Array<MediaReposInterface>,
  maxLogRows: number,
  numLogRows: number,
  pin: string,
  preventExports: boolean,
  preventUploads: boolean,
  qrcodeConfig?: object,
  recordTestLocation?: boolean,
  reloadingBrowser: boolean,
  requireEncryptedResults: boolean,
  resultsMode: ResultsMode,
  server: ProtocolServer,
  servers: {
      gitlab: {
          group?: string,
          host?: string,
          resultsGroup?: string,
          resultsRepo: string,
          repository?: string,
          token?: string,
          version?: string
      },
      localServer: {
          protocolDir: string,
          resultsDir: string,
          resultsDirUri: string
      }
  },
  showUploadSummary: boolean,
  showDisclaimer: boolean,
  suppressAlerts: boolean,
  tabletGain: number,
  tabletLocation: {
      accuracy?: number,
      latitude?: number,
      longitude?: number
  },
  uploadSummary: Array<UploadSummary>,
  validateProtocols: boolean,
  versionCheck: boolean,
  savedDevices: SavedDevices
}


interface UploadSummary {
    protocolId?: string;
    protocolName: string;
    testDateTime: string;
    nResponses: number;
    source: ProtocolServer;
    uploadedOn: string;
    output: ProtocolServer;
}

interface SavedDevices {
    tympan: Array<SavedDevice>;
    cha: Array<SavedDevice>;
    svantek: Array<SavedDevice>;
}

interface SavedDevice {
    tabsintId: string;
    name: string;
    deviceId: string;
}