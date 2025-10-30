import { Inject, Injectable } from '@angular/core';
import _ from 'lodash';
import { DOCUMENT } from '@angular/common';
import { BehaviorSubject } from 'rxjs';

import { DiskInterface, GitlabConfigInterface } from './disk.interface';
import { ExamResults } from '../results/results.interface';
import { ProtocolServer, ResultsMode } from '../../utilities/constants';
import { metaDefaults, partialMetaDefaults } from '../../utilities/defaults';
import { VersionInterface } from '../version/version.interface';

@Injectable({
  providedIn: 'root',
})
export class DiskModel {
  gitlabConfigModel: GitlabConfigInterface = {
    repository: '',
    tag: '',
    host: 'https://gitlab.com/',
    token: '',
    group: '',
  };

  window: (Window & typeof globalThis) | null;

  /**
   * Whether the model has been initially loaded from storage or not.
   * Blocks pushing changes to storage unless the model has been properly initialized.
   */
  private modelInitialized = false;

  disk: DiskInterface = {
    versionCode: '',
    activeProtocolMeta: metaDefaults,
    adminSkipMode: false,
    appDeveloperMode: false,
    appDeveloperModeCount: 0,
    audhere: '',
    autoUpload: true,
    availableProtocolsMeta: {
      // Commenting out purdue shakedown while we develop
      // PurdueShakedown: {
      //     ...partialMetaDefaults,
      //     creator: "Creare",
      //     name: "Purdue Shakedown",
      //     path: "protocols/purdue-shakedown"
      // },
      develop: {
        ...partialMetaDefaults,
        creator: 'Creare',
        name: 'develop',
        path: 'protocols/develop',
      },
    },
    cha: {
      bluetoothType: '',
      embeddedFirmwareBuildDate: '',
      embeddedFirmwareTag: '',
      myCha: '',
    },
    contentURI: null,
    debugMode: false,
    disableAudioStreaming: true,
    disableLogs: false,
    downloadInProgress: false,
    externalMode: false,
    gitlab: {
      repos: [],
      useSeperateResultsRepo: false,
      useTagsOnly: true,
    },
    gitlabConfig: this.gitlabConfigModel,
    headset: 'None',
    interApp: {
      appName: '',
      dataIn: '',
      dataOut: '',
    },
    language: 'English',
    lastReleaseCheck: '',
    mediaRepos: [],
    maxLogRows: 1000,
    numLogRows: 0,
    pin: '7114',
    preventExports: false,
    preventUploads: true,
    reloadingBrowser: false,
    requireEncryptedResults: false,
    resultsMode: ResultsMode.ExportOnly,
    server: ProtocolServer.LocalServer,
    servers: {
      gitlab: {
        resultsRepo: 'results',
      },
      localServer: {
        protocolDir: 'tabsint-protocols',
        resultsDir: 'tabsint-results',
        resultsDirUri: '',
      },
    },
    showUploadSummary: true,
    showDisclaimer: true,
    suppressAlerts: false,
    tabletGain: 12.34,
    tabletLocation: {},
    uploadSummary: [],
    validateProtocols: true,
    versionCheck: false,
    savedDevices: { tympan: [], cha: [], svantek: [] },
  };

  diskSubject = new BehaviorSubject<DiskInterface>(this.disk);

  constructor(@Inject(DOCUMENT) private readonly document: Document) {
    this.window = document.defaultView;
  }

  /**
   * Get a structured clone of the disk model.
   * @returns  A structured clone of the disk model.
   */
  getDisk(): DiskInterface {
    return structuredClone(this.disk);
  }

  /**
   * Load tabsint version information from version.js
   * Note: This is separate from the version model to avoid circular logging dependencies.
   *
   * @summary Imports version.json, returns the version code.
   * @returns The version code of the application or undefined if not found.
   */
  private async getVersionCode(): Promise<string | undefined> {
    let versionCode = undefined;
    try {
      const versionData = await import('../../../version.json');
      if (versionData.default) {
        const version = versionData.default as VersionInterface;
        versionCode = version.version_code;
      }
    } catch (error) {
      console.log('Error retrieving the version code' + error);
    }
    return versionCode;
  }

  /**
   * Initialize the disk model for the application and load from storage if possible.
   * In the event that the version of the model does not align with the current app version, reset the disk model on storage.
   */
  async initializeDiskModel(): Promise<void> {
    // Setup the versioning for the disk model and set the model as initialized
    this.modelInitialized = true;
    this.disk.versionCode = (await this.getVersionCode()) ?? this.disk.versionCode;
    if (this.window !== null && !_.isUndefined(this.window.localStorage)) {
      const diskModelString = this.window.localStorage.getItem('diskModel');
      if (diskModelString === null) {
        // Set the disk model in local storage if not available
        console.log('No disk model available, restoring defaults.');
        this.storeDisk();
      } else {
        let newDiskModel = undefined;
        try {
          newDiskModel = JSON.parse(diskModelString);
        } catch (error) {
          console.log('Error parsing disk model' + error);
        }
        if (newDiskModel?.versionCode && newDiskModel?.versionCode === this.disk.versionCode) {
          this.disk = newDiskModel;
        } else {
          // Reset the local storage if parsing fails or version codes do not align
          console.log('Stored disk version did not match latest disk, restoring defaults.');
          this.storeDisk();
        }
      }
    }
  }

  /**
   * Store disk model on local storage
   * @summary When window and local storage are defined, store disk model on local storage\
   */
  storeDisk(): void {
    if (this.modelInitialized && this.window !== null && !_.isUndefined(this.window.localStorage)) {
      this.window.localStorage.setItem('diskModel', JSON.stringify(this.disk));
    }
    this.diskSubject.next(this.disk);
  }

  /**
   * Convenience function to update disk in local storage.
   * @summary Set key: value on the disk model, then store the disk model on local storage.
   * @models disk
   * @param key: key of the parameter to update on the disk model
   * @param value: value to change the parameter to
   */
  updateDiskModel(key: string, value: any) {
    if (_.has(this.disk, key)) {
      _.set(this.disk, key, value);
      this.storeDisk();
    }
  }

  /**
   * Update summary info that is used to display recently exported or uploaded results
   * @summary Add result meta data to disk.uploadSumary, then store it on local storage
   * @models disk
   * @param result: exam result
   */
  updateSummary(result: ExamResults) {
    const meta = {
      protocolId: result.protocol.protocolId,
      protocolName: result.protocol.name,
      testDateTime: result.testDateTime!,
      nResponses: _.isUndefined(result.responses) ? 0 : result.responses.length,
      source: result.protocol.server,
      output: result.exportLocation ?? result.protocol.server,
      uploadedOn: new Date().toJSON(),
    };
    this.disk.uploadSummary.unshift(meta);
    this.storeDisk();
  }
}
