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
import { EncryptResultsService } from '../utilities/encrypt-results.service';

@Injectable({
  providedIn: 'root',
})
export class ResultsService {
  private readonly devicesService = inject(DevicesService);
  private readonly diskModel = inject(DiskModel);
  private readonly encryptResults = inject(EncryptResultsService);
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
      eachCorrect: undefined,
      numberCorrect: undefined,
      numberIncorrect: undefined,
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
   * Save exam results.
   * @summary Encrypts result if the active protocol has a publicKey, and stores result in SQLite,
   * then backs up to tablet storage in plaintext.
   * @param result Partial or completed current exam result.
   */
  async save(result: ExamResults) {
    const publicKey = this.protocol.activeProtocol?.publicKey;
    const uuid = this.hostMetadata?.uuid;
    if (publicKey && uuid && result.testDateTime) {
      const encrypted = await this.encryptResults.encryptForStorage(result.testDateTime, uuid, JSON.stringify(result));
      await this.sqLite.store('results', JSON.stringify({ testDateTime: result.testDateTime, encrypted }));
    } else {
      await this.sqLite.store('results', JSON.stringify(result));
    }
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
   * Retrieve all exam results from SQLite, decrypting any encrypted entries.
   */
  async getAllResults(): Promise<ExamResults[]> {
    const rawResults = await this.sqLite.getAllResultsRaw();
    const results: ExamResults[] = [];
    for (const raw of rawResults) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed.encrypted && parsed.testDateTime) {
          const uuid = this.hostMetadata?.uuid;
          if (uuid) {
            const decrypted = await this.encryptResults.decryptFromStorage(parsed.testDateTime, uuid, parsed.encrypted);
            results.push(JSON.parse(decrypted));
          }
        } else {
          results.push(parsed);
        }
      } catch (e) {
        this.logger.error('Failed to parse/decrypt result: ' + e);
      }
    }
    return results;
  }

  /**
   * Retrieve a single exam result from SQLite by index, decrypting if necessary.
   */
  async getSingleResult(index: number): Promise<ExamResults | null> {
    try {
      const rawArr = await this.sqLite.getSingleResult(index);
      const parsed = JSON.parse(rawArr[0]);
      if (parsed.encrypted && parsed.testDateTime) {
        const uuid = this.hostMetadata?.uuid;
        if (uuid) {
          const decrypted = await this.encryptResults.decryptFromStorage(parsed.testDateTime, uuid, parsed.encrypted);
          return JSON.parse(decrypted);
        }
      }
      return parsed;
    } catch (e) {
      this.logger.error('Failed to parse/decrypt single result: ' + e);
      return null;
    }
  }

  /**
   * Export an exam result to the tablet's local storage.
   * @summary Get the result from sqlite, write it to Android, remove
   * it from the sqlite database.
   * @param index number: index of the result
   */
  async exportSingleResult(index: number) {
    const result = await this.getSingleResult(index);
    if (result) {
      await this.writeResultToFile(result);
    }
    await this.sqLite.deleteSingleResult(index);
  }

  /**
   * Write result to tablet's local storage.
   * @summary Construct path and filename, write file(s) to tablet, update disk upload summary.
   * If the active protocol has a publicKey, encrypts the result and writes a .json.enc file
   * alongside a .json.key.enc file containing the RSA-encrypted AES key.
   * @models disk
   * @param result exam result
   */
  async writeResultToFile(result: ExamResults) {
    const dir = (this.disk.preferences.servers.localServer.resultsDir ?? 'tabsint-results') + '/' + this.protocol.activeProtocol?.name + '/';

    const publicKey = this.protocol.activeProtocol?.publicKey;
    const uuid = this.hostMetadata?.uuid;

    if (publicKey && uuid && result.testDateTime) {
      const [encryptedResult, encryptedAESKey] = await this.encryptResults.encryptForUpload(
        result.testDateTime,
        uuid,
        publicKey,
        JSON.stringify(result)
      );
      const encFilename = constructFilename(
        this.hostMetadata?.uuid?.slice(-6) ?? '',
        this.protocol.activeProtocol?.resultFilename,
        result.testDateTime,
        '.json.enc'
      );
      const keyFilename = constructFilename(
        this.hostMetadata?.uuid?.slice(-6) ?? '',
        this.protocol.activeProtocol?.resultFilename,
        result.testDateTime,
        '.json.key.enc'
      );
      await this.fileService.writeFile(dir + encFilename, encryptedResult);
      await this.fileService.writeFile(dir + keyFilename, encryptedAESKey);
    } else {
      const filename = constructFilename(
        this.hostMetadata?.uuid?.slice(-6) ?? '',
        this.protocol.activeProtocol?.resultFilename,
        result.testDateTime,
        '.json'
      );
      await this.fileService.writeFile(dir + filename, JSON.stringify(result));
    }

    this.diskModel.updateSummary(result);
  }
}
