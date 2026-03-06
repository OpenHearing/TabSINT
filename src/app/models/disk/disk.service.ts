import { inject, Injectable } from '@angular/core';
import _ from 'lodash';
import { BehaviorSubject } from 'rxjs';

import { DiskInterface, GitlabConfigInterface } from './disk.interface';
import { ExamResults } from '../results/results.interface';
import { diskSchema } from '../../../schema/definitions/disk.schema';
import { safeParse } from '../../utilities/safe-parsing';
import { Preferences } from '../../interfaces/preferences.interface';
import { AppWindow } from '../../utilities/window';
import { DOCUMENT } from '@angular/common';

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

  window: AppWindow | null;

  disk: DiskInterface = {
    activeProtocolMeta: structuredClone(diskSchema.properties.activeProtocolMeta.default),
    appDeveloperModeCount: structuredClone(diskSchema.properties.appDeveloperModeCount.default),
    audhere: structuredClone(diskSchema.properties.audhere.default),
    availableProtocolsMeta: structuredClone(diskSchema.properties.availableProtocolsMeta.default),
    contentURI: structuredClone(diskSchema.properties.contentURI.default),
    downloadInProgress: structuredClone(diskSchema.properties.downloadInProgress.default),
    interApp: structuredClone(diskSchema.properties.interApp.default),
    lastReleaseCheck: structuredClone(diskSchema.properties.lastReleaseCheck.default),
    mediaRepos: structuredClone(diskSchema.properties.mediaRepos.default),
    numLogRows: structuredClone(diskSchema.properties.numLogRows.default),
    reloadingBrowser: structuredClone(diskSchema.properties.reloadingBrowser.default),
    tabletLocation: structuredClone(diskSchema.properties.tabletLocation.default),
    uploadSummary: structuredClone(diskSchema.properties.uploadSummary.default),
    savedDevices: structuredClone(diskSchema.properties.savedDevices.default),
    showDisclaimer: structuredClone(diskSchema.properties.showDisclaimer.default),
    preferences: structuredClone(diskSchema.properties.preferences.default),
  };

  diskSubject = new BehaviorSubject<DiskInterface>(this.disk);

  private readonly document = inject(DOCUMENT);

  constructor() {
    this.window = this.document.defaultView;
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
   * Update the disk held in local storage.
   * @param diskPartial The partial object to update the disk with.
   */
  updateDiskModel(diskPartial: Partial<DiskInterface>) {
    const updatedPartial = structuredClone(diskPartial);
    this.disk = { ...this.disk, ...updatedPartial };
    this.storeDisk();
  }

  /**
   * Update the preferences held in local storage.
   * @param preferencesPartial The partial object to update the preferences with.
   */
  updatePreferences(preferencesPartial: Partial<Preferences>) {
    const updatedPartial = structuredClone(preferencesPartial);
    this.disk.preferences = { ...this.disk.preferences, ...updatedPartial };
    this.storeDisk();
  }

  /**
   * Reset preferences held in local storage to the default values.
   */
  resetPreferences() {
    this.disk.preferences = structuredClone(diskSchema.properties.preferences.default);
    this.storeDisk();
  }

  /**
   * Update summary info that is used to display recently exported or uploaded results
   * @summary Add result meta data to disk.uploadSummary, then store it on local storage
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
