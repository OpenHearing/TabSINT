import { MediaReposInterface } from "../../interfaces/media-repos.interface"
import { ProtocolServer, ResultsMode } from "../../utilities/constants"
import { ProtocolMetaInterface } from "../protocol/protocol.interface"
import { ExamResults } from "../results/results.interface"

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
    qrcodeConfig?: Object,
    debugMode: boolean,
    disableLogs: boolean,
    maxLogRows: number,
    numLogRows: number,
    pin: string,
    disableVolume?: boolean,
    requireEncryptedResults?: boolean,
    recordTestLocation?: boolean,
    adminSkipMode: boolean,
    autoUpload?: boolean,
    disableAudioStreaming?: boolean,
    server: ProtocolServer,
    tabletGain: number,
    extStorageRootDir?: string,
    extStorageUuidDir?: string,
    tympan: {
      embeddedFirmwareBuildDate: string,
      embeddedFirmwareTag: string,
      myTympan: string,
      bluetoothType: string
    },
    cha: {
      embeddedFirmwareBuildDate: string,
      embeddedFirmwareTag: string,
      myCha: string
  },
  contentURI: string | undefined,
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
  init: boolean,
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
  qrcodeConfig?: Object,
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
  suppressAlerts: boolean,
  tabletGain: number,
  tabletLocation: {
      accuracy?: number,
      latitude?: number,
      longitude?: number
  },
  uploadSummary: Array<UploadSummary>,
  validateProtocols: boolean,
  versionCheck: boolean
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
