import { MediaReposInterface } from "../../interfaces/media-repos.interface"
import { ResultsMode, Server } from "../../utilities/constants"
import { ProtocolInterface } from "../protocol/protocol.interface"

export interface DiskInterface {
    qrcodeConfig?: Object,
    debugMode?: boolean,
    disableLogs?: boolean,
    pin?: string,
    disableVolume?: boolean,
    requireEncryptedResults?: boolean,
    recordTestLocation?: boolean,
    adminSkipMode?: boolean,
    autoUpload?: boolean,
    disableAudioStreaming?: boolean,
    server?: Server,
    tabletGain?: number,
    extStorageRootDir?: string,
    extStorageUuidDir?: string,
    cha?: {
      embeddedFirmwareBuildDate: string,
      embeddedFirmwareTag: string
    },
    externalMode: boolean,
    appDeveloperMode: boolean,
    appDeveloperModeCount: number,
    uploadSummary: Array<string>,
    suppressAlerts: boolean,
    showUploadSummary: boolean,
    resultsMode: ResultsMode,
    preventUploads: boolean,
    preventExports: boolean,
    reloadingBrowser: boolean,
    downloadInProgress: boolean,
    lastReleaseCheck: string,
    validateProtocols: boolean,
    completedResults: Array<string>,
    currentResults?: Array<string>,
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
    activeProtocol: ProtocolInterface, 
    loadedProtocols: Array<ProtocolInterface>, 
    mediaRepos: Array<MediaReposInterface>, 
    servers: {
      localServer?: {
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
    audhere: string 
  
}