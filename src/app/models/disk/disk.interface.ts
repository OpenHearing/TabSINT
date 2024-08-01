import { MediaReposInterface } from "../../interfaces/media-repos.interface"
import { ProtocolServer, ResultsMode } from "../../utilities/constants"
import { ProtocolMetaInterface } from "../protocol/protocol.interface"
import { ExamResults } from "../results/results.interface"

export interface DiskInterface {
    qrcodeConfig?: Object,
    debugMode: boolean,
    disableLogs: boolean,
    maxLogRows: number,
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
      myCha: string,
      bluetoothType: string
    },
    contentURI: string | undefined,
    externalMode: boolean,
    appDeveloperMode: boolean,
    appDeveloperModeCount: number,
    uploadSummary: Array<UploadSummary>,
    suppressAlerts: boolean,
    showUploadSummary: boolean,
    resultsMode: ResultsMode,
    preventUploads: boolean,
    preventExports: boolean,
    reloadingBrowser: boolean,
    downloadInProgress: boolean,
    lastReleaseCheck: string,
    validateProtocols: boolean,
    tabletLocation: {
      latitude?: number,
      longitude?: number,
      accuracy?: number
    },
    gitlab: {
      repos: Array<string>,
      useTagsOnly: boolean,
      useSeperateResultsRepo: boolean
    },
    mediaRepos: Array<MediaReposInterface>, 
    servers: {
      localServer: {
        resultsDir: string,
        protocolDir: string
      },
      gitlab: {
        repository?: string,
        version?: string,
        host?: string,
        token?: string,
        group?: string,
        resultsGroup?: string,
        resultsRepo: string
      }
    },
    headset: string,
    language: string,
    interApp: {
      appName: string,
      dataIn: string,
      dataOut: string
    },
    init: boolean, 
    versionCheck: boolean,
    audhere: string ,
    activeProtocolMeta: ProtocolMetaInterface,
    availableProtocolsMeta: Array<ProtocolMetaInterface>
}

interface UploadSummary {
  protocolId: string;
  protocolName: string;
  testDateTime: string;
  nResponses: number;
  source: ProtocolServer;
  uploadedOn: string;
  output: ProtocolServer;
}
