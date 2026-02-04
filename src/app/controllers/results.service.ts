import { inject, Injectable } from '@angular/core';
import _ from 'lodash';
import { Subscription } from 'rxjs';

import { ResultsInterface, ExamResults, CurrentResults } from '../models/results/results.interface';
import { ProtocolModelInterface } from '../models/protocol/protocol.interface';
import { PageInterface } from '../models/page/page.interface';
import { DiskInterface } from '../models/disk/disk.interface';
import { VersionInterface } from '../models/version/version.interface';

import { ResultsModel } from '../models/results/results-model.service';
import { DiskModel } from '../models/disk/disk.service';
import { ProtocolModel } from '../models/protocol/protocol-model.service';
import { constructFilename } from '../utilities/results-helper-functions';
import { FileService } from '../services/file.service';
import { Logger } from '../services/logger.service';
import { SqLite } from '../services/sqLite.service';
import { VersionModel } from '../models/version/version.service';
import { DevicesService } from '../services/devices/devices.service';
import { IDeviceMetadata } from '../interfaces/devices/device-metadata.interface';
import { IDevice } from '../interfaces/devices/device.interface';
import { DeviceState } from '../utilities/constants';

@Injectable({
  providedIn: 'root',
})
export class ResultsService {
  private readonly devicesService = inject(DevicesService);
  private readonly diskModel = inject(DiskModel);
  private readonly fileService = inject(FileService);
  private readonly logger = inject(Logger);
  private readonly protocolM = inject(ProtocolModel);
  private readonly resultsModel = inject(ResultsModel);
  private readonly sqLite = inject(SqLite);
  private readonly versionModel = inject(VersionModel);

  results: ResultsInterface;
  protocol: ProtocolModelInterface;
  hostMetadata: IDeviceMetadata;
  version: VersionInterface;
  disk: DiskInterface;
  connectedDeviceNames: string[];
  diskSubscription: Subscription | undefined;
  resultsSubscription: Subscription | undefined;
  hostMetadataSubscription: Subscription | undefined;
  devicesSubscription: Subscription | undefined;

  constructor() {
    this.results = this.resultsModel.getResults();
    this.protocol = this.protocolM.getProtocolModel();
    this.hostMetadata = {};
    this.connectedDeviceNames = [];
    this.version = this.versionModel.version;
    this.disk = this.diskModel.getDisk();
    this.hostMetadataSubscription = this.devicesService.hostMetadata.subscribe((hostMetadata: IDeviceMetadata) => {
      this.hostMetadata = hostMetadata;
      this.resultsModel.updateCurrentExam({ hostMetadata: this.hostMetadata });
    });
    this.devicesSubscription = this.devicesService.devices.subscribe((devices: IDevice[]) => {
      this.connectedDeviceNames = devices.filter(device => device.state == DeviceState.Connected).map(device => device.name);
      this.resultsModel.updateCurrentExam({ devices: this.connectedDeviceNames });
    });
    this.diskSubscription = this.diskModel.diskSubject.subscribe((updatedDisk: DiskInterface) => {
      this.disk = updatedDisk;
    });
    this.resultsSubscription = this.resultsModel.resultsSubject.subscribe(updatedResults => {
      this.results = updatedResults;
    });
  }

  /** Initializes Exam results before starting the first page.
   * @summary Initializes results with protocol ID, test date and other information.
   * @models results, protocol, disk
   */
  initializeExamResults() {
    const currentExam = {
      testDateTime: new Date().toJSON(),
      elapsedTime: undefined,
      protocol: _.cloneDeep(this.protocol.activeProtocol!),
      responses: [],
      softwareVersion: this.version,
      hostMetadata: this.hostMetadata,
      tabletLocation: this.disk.tabletLocation,
      calibrationVersion: {
        audioProfileVersion: this.protocol.activeProtocol!._audioProfileVersion,
        calibrationPySVNRevision: this.protocol.activeProtocol!._calibrationPySVNRevision,
        calibrationPyManualReleaseDate: this.protocol.activeProtocol!._calibrationPyManualReleaseDate,
      },
      flags: {},
    };

    this.resultsModel.updateCurrentExam(currentExam);
    this.results = this.resultsModel.getResults();
  }

  /** Initializes page results before starting the page.
   * @summary Initializes results with page ID, response and other information.
   * @param currentPage exam page to initialize.
   * @models results
   */
  initializePageResults(currentPage: PageInterface) {
    const res = {
      pageId: currentPage.id,
      response: '',
      correct: undefined,
      isSkipped: false,
      responseArea: currentPage.responseArea ? currentPage.responseArea.type : undefined,
      page: currentPage,
    };

    this.resultsModel.updateCurrentPage(res);
    this.results = this.resultsModel.getResults();
  }

  /**
   * Push response to current exam results.
   * @models results
   * @param response Response for the current page.
   */
  pushResults(currentPageResults: CurrentResults) {
    this.resultsModel.pushResponse(currentPageResults);
  }

  /**
   * Save exam results
   * @summary Save result in SQLite db, than backup results on tablet.
   * @param result Partial or completed current exam result.
   */
  async save(result: ExamResults) {
    await this.sqLite.store('results', JSON.stringify(result));
    await this.backup(result);
  }

  /**
   * Save current exam results on the tablet at Documents/.tabsint-results-backup/
   * @param result Partial or completed current exam result
   */
  async backup(result: ExamResults) {
    const filename = constructFilename(
      this.hostMetadata?.uuid?.slice(-6) ?? '',
      this.protocol.activeProtocol?.resultFilename,
      result.testDateTime,
      'json'
    );
    const dir = '.tabsint-results-backup/' + this.protocol.activeProtocol?.name + '/';

    try {
      await this.fileService.writeFile(dir + filename, JSON.stringify(result));
    } catch (e) {
      this.logger.error('Failed to export backup result to file with error: ' + _(e).toJSON);
    }
  }

  /**
   * Delete one exam result from the sqlite database.
   */
  async deleteSingleResult(index: number) {
    this.sqLite.deleteSingleResult(index);
  }

  /**
   * Export an exam result to the tablet's local storage.
   * @summary Get the result from sqlite, write it to Android, remove
   * it from the sqlite database.
   * @param index number: index of the result
   */
  async exportSingleResult(index: number) {
    const result = await this.sqLite.getSingleResult(index);
    await this.writeResultToFile(JSON.parse(result[0]));
    await this.sqLite.deleteSingleResult(index);
  }

  /**
   * Write result to tablet's local storage.
   * @summary Construct path and filename, write file to tablet, update disk upload summary.
   * @models disk
   * @param result exam result
   */
  async writeResultToFile(result: ExamResults) {
    const filename = constructFilename(
      this.hostMetadata?.uuid?.slice(-6) ?? '',
      this.protocol.activeProtocol?.resultFilename,
      result.testDateTime,
      '.json'
    );
    let dir = this.disk.servers.localServer.resultsDir ? this.disk.servers.localServer.resultsDir : 'tabsint-results';
    dir = dir + '/' + this.protocol.activeProtocol?.name + '/';
    await this.fileService.writeFile(dir + filename, JSON.stringify(result));
    this.diskModel.updateSummary(result);
  }
}
