import { Inject, Injectable } from '@angular/core';
import _ from 'lodash';
import { DOCUMENT } from '@angular/common';
import { BehaviorSubject } from 'rxjs';

import { DiskInterface, GitlabConfigInterface } from './disk.interface';
import { ExamResults } from '../results/results.interface';
import { diskSchema } from '../../../schema/definitions/disk.schema';
import { safeParse } from '../../utilities/safe-parsing';

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

  disk: DiskInterface = {
    activeProtocolMeta: diskSchema.properties.activeProtocolMeta.default,
    adminSkipMode: diskSchema.properties.adminSkipMode.default,
    appDeveloperMode: diskSchema.properties.appDeveloperMode.default,
    appDeveloperModeCount: diskSchema.properties.appDeveloperModeCount.default,
    audhere: diskSchema.properties.audhere.default,
    autoUpload: diskSchema.properties.autoUpload.default,
    availableProtocolsMeta: diskSchema.properties.availableProtocolsMeta.default,
    contentURI: diskSchema.properties.contentURI.default,
    debugMode: diskSchema.properties.debugMode.default,
    disableAudioStreaming: diskSchema.properties.disableAudioStreaming.default,
    disableLogs: diskSchema.properties.disableLogs.default,
    downloadInProgress: diskSchema.properties.downloadInProgress.default,
    externalMode: diskSchema.properties.externalMode.default,
    gitlab: diskSchema.properties.gitlab.default,
    gitlabConfig: diskSchema.properties.gitlabConfig.default,
    headset: diskSchema.properties.headset.default,
    interApp: diskSchema.properties.interApp.default,
    language: diskSchema.properties.language.default,
    lastReleaseCheck: diskSchema.properties.lastReleaseCheck.default,
    mediaRepos: diskSchema.properties.mediaRepos.default,
    maxLogRows: diskSchema.properties.maxLogRows.default,
    numLogRows: diskSchema.properties.numLogRows.default,
    pin: diskSchema.properties.pin.default,
    preventExports: diskSchema.properties.preventExports.default,
    preventUploads: diskSchema.properties.preventUploads.default,
    reloadingBrowser: diskSchema.properties.reloadingBrowser.default,
    requireEncryptedResults: diskSchema.properties.requireEncryptedResults.default,
    resultsMode: diskSchema.properties.resultsMode.default,
    server: diskSchema.properties.server.default,
    servers: diskSchema.properties.servers.default,
    showUploadSummary: diskSchema.properties.showUploadSummary.default,
    showDisclaimer: diskSchema.properties.showDisclaimer.default,
    suppressAlerts: diskSchema.properties.suppressAlerts.default,
    tabletGain: diskSchema.properties.tabletGain.default,
    tabletLocation: diskSchema.properties.tabletLocation.default,
    uploadSummary: diskSchema.properties.uploadSummary.default,
    validateProtocols: diskSchema.properties.validateProtocols.default,
    versionCheck: diskSchema.properties.versionCheck.default,
    savedDevices: diskSchema.properties.savedDevices.default,
    wahtsConnectionType: diskSchema.properties.wahtsConnectionType.default,
  };

  diskSubject = new BehaviorSubject<DiskInterface>(this.disk);

  constructor(@Inject(DOCUMENT) private readonly document: Document) {
    this.window = document.defaultView;
    this.initializeDiskModel();
  }

  /**
   * Get a structured clone of the disk model.
   * @returns A structured clone of the disk model.
   */
  getDisk(): DiskInterface {
    return structuredClone(this.disk);
  }

  /**
   * Initialize the disk model for the application.
   */
  initializeDiskModel(): void {
    if (this.window !== null && !_.isUndefined(this.window.localStorage)) {
      const storedModel = this.window.localStorage.getItem('diskModel');
      if (storedModel !== null) {
        const parsedModel = safeParse(storedModel, diskSchema);
        this.disk = parsedModel ?? this.disk;
      }
      // Store the new model in case it was updated during parsing or was invalid
      this.storeDisk();
    }
  }

  /**
   * Store disk model on local storage
   * @summary When window and local storage are defined, store disk model on local storage\
   */
  storeDisk(): void {
    if (this.window !== null && !_.isUndefined(this.window.localStorage)) {
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
