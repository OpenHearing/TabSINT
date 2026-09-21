import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { ResultsInterface } from '../../../../models/results/results.interface';
import { PageInterface } from '../../../../models/page/page.interface';
import { ResultsModel } from '../../../../models/results/results-model.service';
import { PageModel } from '../../../../models/page/page.service';
import { StateInterface } from '../../../../models/state/state.interface';
import { StateModel } from '../../../../models/state/state.service';
import { Logger } from '../../../../services/logger.service';
import { DuodoseDownloadInterface, DoseFile } from './duodose-download.interface';
import { DevicesService } from '../../../../services/devices/devices.service';
import { DeviceType } from '../../../../utilities/constants';
import { IDevice } from '../../../../interfaces/devices/device.interface';
import { isGetDirectoryResponse, isLongNameResponse } from '../../../../guards/type.guard';
import { DoseSessionRecord, findSessionByStart, parseDuodoseLog } from '../../../../utilities/duodose-log-parser';
import {
  buildDoseResultsTable,
  DEVICE_HEADER,
  DoseResultsTable,
  DURATION_HEADER,
  IMPULSES_HEADER,
  PEAK_HEADER,
  START_HEADER,
} from '../../../../utilities/duodose-results';

@Component({
  selector: 'app-duodose-download',
  templateUrl: './duodose-download.component.html',
  styleUrl: './duodose-download.component.css',
})
export class DuodoseDownloadComponent implements OnInit, OnDestroy {
  private readonly devicesService = inject(DevicesService);
  private readonly resultsModel = inject(ResultsModel);
  private readonly pageModel = inject(PageModel);
  private readonly stateModel = inject(StateModel);
  private readonly logger = inject(Logger);

  results: ResultsInterface;
  state: StateInterface;

  pageSubscription: Subscription | undefined;
  stateSubscription: Subscription | undefined;
  resultsSubscription: Subscription | undefined;

  tabsintId: string | undefined;
  dosimeter: IDevice | undefined;
  availableFiles: DoseFile[] = [];
  viewingFile = false;
  resultsFieldsDefault = [
    'Channel 1',
    'Channel 2',
    'Channel 3',
    'Channel 4',
    PEAK_HEADER,
    IMPULSES_HEADER,
    DEVICE_HEADER,
    DURATION_HEADER,
    START_HEADER,
  ];
  resultsValuesDefault = this.resultsFieldsDefault.map(() => '');

  resultsValues = this.resultsValuesDefault.slice();
  resultsFields = this.resultsFieldsDefault.slice();
  resultsList: string[][] = [];

  downloadInProgress = false;
  downloadProgressPercent = 100;
  bytesFree: string | number = 'calculating...';
  bytesFreeUnits = 'B';
  baseDir = '../USER/';
  tmpFileContents = '';
  downloadedLogFiles = [];

  isDosBusy = true;

  /** Set in ngOnDestroy so in-flight device requests stop issuing further adapter calls once the page is left. */
  private destroyed = false;

  private static readonly SESSION_NAME_RE = /^(?<device>.+?)_(?<datetime>\d{8}T\d{6}\.\d{3}Z)_(?<session>.*)$/;

  constructor() {
    this.results = this.resultsModel.getResults();
    this.state = this.stateModel.getState();
  }

  ngOnInit(): void {
    this.stateSubscription = this.stateModel.stateSubject.subscribe((updatedState: StateInterface) => {
      this.state = updatedState;
    });
    this.resultsSubscription = this.resultsModel.resultsSubject.subscribe((updatedResults: ResultsInterface) => {
      this.results = updatedResults;
    });
    this.pageSubscription = this.pageModel.currentPageObservable.subscribe((updatedPage: PageInterface) => {
      if (updatedPage?.responseArea?.type === 'duodoseDownloadResponseArea') {
        const updatedDuodoseDownloadResponseArea = updatedPage.responseArea as DuodoseDownloadInterface;
        if (updatedDuodoseDownloadResponseArea) {
          this.tabsintId = updatedDuodoseDownloadResponseArea?.tabsintId;
        }
        setTimeout(async () => {
          this.getDosimeterFiles();
        }, 10);
      }
    });
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.pageSubscription?.unsubscribe();
    this.stateSubscription?.unsubscribe();
    this.resultsSubscription?.unsubscribe();
  }

  async getDosimeterFiles() {
    if (this.destroyed) return;
    this.isDosBusy = true;
    this.availableFiles = [];
    try {
      const dosimeters = await this.devicesService.getDeviceOrDefault(this.tabsintId, [DeviceType.Duodose]);
      if (this.destroyed) return;
      if (dosimeters.length === 0) {
        this.logger.error('Error with duodose data download: No dosimeter was available.');
        return;
      }
      if (dosimeters.length >= 2) {
        this.logger.error('Error with duodose data download: Multiple devices available and one was not specified.');
        return;
      }
      this.dosimeter = dosimeters[0];
      const device = this.dosimeter;

      const freeSpaceResponse = await this.devicesService.requestSdBytesFree(device);
      if (this.destroyed) return;
      const freeSpace = freeSpaceResponse?.msg?.[1];
      if (typeof freeSpace === 'object' && freeSpace !== null && 'BytesFree' in freeSpace) {
        [this.bytesFree, this.bytesFreeUnits] = this.parseFreeSpace(freeSpace.BytesFree as string);
      } else {
        this.logger.error('Error with duodose data download requesting free space.');
        return;
      }

      this.availableFiles = await this.listSessionFolders(device);
    } catch (error) {
      this.logger.error(`Error with duodose data download listing files: ${JSON.stringify(error)}`);
    } finally {
      this.isDosBusy = false;
    }
  }

  /**
   * List the session folders on a device, resolving each entry's long file name.
   * Checks `destroyed` before each device request so leaving the page stops the loop from
   * issuing further adapter calls once the response area is gone.
   * @param device The device to list session folders from.
   * @returns The parsed session folders found so far; may be incomplete if the page was left mid-loop.
   */
  private async listSessionFolders(device: IDevice): Promise<DoseFile[]> {
    const files: DoseFile[] = [];

    const dirResponse = await this.devicesService.getDirectory(device, this.baseDir);
    if (this.destroyed) return files;
    if (!isGetDirectoryResponse(dirResponse)) {
      this.logger.error('Error with duodose data download getting directory names.');
      return files;
    }

    for (const entry of dirResponse.msg[1]) {
      if (this.destroyed) return files;
      const longNameResponse = await this.devicesService.getChaLongName(device, this.baseDir + entry.Path);
      if (this.destroyed) return files;

      if (!isLongNameResponse(longNameResponse)) {
        this.logger.debug(`duodose download, unexpected long name response for ${entry.Path}: ${JSON.stringify(longNameResponse)}`);
        continue;
      }
      // Newer firmware lists full names directly and returns an empty long name; fall back to the listed path.
      const longName = longNameResponse.msg[0] || entry.Path;

      const doseFile = this.parseDoseFileName(longName);
      if (doseFile) {
        files.push(doseFile);
      } else {
        // Not a folder containing data (e.g. CONFIG, the log CSV). Eventually may want to add log file and CONFIG.
        this.logger.debug(`duodose download, ignoring entry without session data: ${longName}`);
      }
    }
    return files;
  }

  /**
   * Parse a session folder name of the form `<device>_<yyyymmddThhmmss.sssZ>_<session>`.
   * @returns The parsed file, or undefined when the name is not a session folder.
   */
  parseDoseFileName(name: string): DoseFile | undefined {
    const match = DuodoseDownloadComponent.SESSION_NAME_RE.exec(name);
    if (!match?.groups) return undefined;
    const { device, datetime, session } = match.groups;
    return {
      longName: name,
      selected: false,
      deviceName: device,
      sessionName: session,
      datetime,
      parsedDatetime: this.parseDatetime(datetime).toLocaleString('UTC', { timeZone: 'UTC' }),
    };
  }

  parseFreeSpace(byteString: string): [number, string] {
    let val;
    let units;
    const bytes = Number(byteString);
    if (bytes > 1 && bytes < 1000) {
      val = bytes;
      units = 'B';
    } else if (bytes / 1000 > 1 && bytes / 1000 < 1000) {
      val = bytes / 1000;
      units = 'KB';
    } else if (bytes / 1000000 > 1 && bytes / 1000000 < 1000) {
      val = bytes / 1000000;
      units = 'MB';
    } else {
      val = bytes / 1000000000;
      units = 'GB';
    }

    return [Math.round(val * 100) / 100, units];
  }

  parseDatetime(dt: string) {
    const year = Number(dt.split('T')[0].slice(0, 4));
    const month = Number(dt.split('T')[0].slice(4, 6));
    const day = Number(dt.split('T')[0].slice(6, 8));
    const hour = Number(dt.split('T')[1].slice(0, 2));
    const minute = Number(dt.split('T')[1].slice(2, 4));
    const second = Number(dt.split('T')[1].slice(4, 6));

    const pd = new Date(Date.UTC(year, month - 1, day, hour, minute, second));
    return pd;
  }

  /**
   * Show the results for the selected sessions without saving them.
   */
  async viewDoseData(): Promise<void> {
    const table = await this.loadSelectedResults();
    if (table) {
      this.resultsFields = table.headers;
      this.resultsList = table.sessions;
      this.resultsValues = table.combined;
    }
  }

  /**
   * Show the results for the selected sessions and save them to the current page response.
   */
  async addDoseDataToResults(): Promise<void> {
    const table = await this.loadSelectedResults();
    if (!table) return;
    this.resultsFields = table.headers;
    this.resultsList = table.sessions;
    this.resultsValues = table.combined;
    this.results.currentPage.response = {
      headers: table.headers,
      sessions: table.sessions,
      combined: table.combined,
    };
    this.resultsModel.updateCurrentPage({ response: this.results.currentPage.response });
  }

  /**
   * Read the device log and build the results table for the selected sessions.
   * @returns The table, or undefined when nothing is selected, the device is busy, or the read failed.
   */
  private async loadSelectedResults(): Promise<DoseResultsTable | undefined> {
    this.resultsFields = this.resultsFieldsDefault.slice();
    this.resultsValues = this.resultsValuesDefault.slice();
    this.resultsList = [];

    if (this.isDosBusy || !this.dosimeter) return undefined;
    const selectedEntries = this.availableFiles.filter(entry => entry.selected);
    if (selectedEntries.length === 0) return undefined;

    this.isDosBusy = true;
    this.viewingFile = true;
    const deviceName = selectedEntries[0].deviceName;
    const fileToRead = `${deviceName}_Log.csv`;

    try {
      const resp = await this.devicesService.copyChaFileToLocalStorageAndReadFile(this.dosimeter, this.baseDir + fileToRead);
      const text = typeof resp?.msg?.[0] === 'string' ? resp.msg[0] : '';
      if (text === '') {
        this.logger.error(`Error reading duodose log ${fileToRead}: empty response.`);
        return undefined;
      }
      const log = parseDuodoseLog(text);

      const records: DoseSessionRecord[] = [];
      for (const entry of selectedEntries) {
        const record = findSessionByStart(log, this.parseDatetime(entry.datetime));
        if (record) {
          records.push(record);
        } else {
          this.logger.error(`Duodose session ${entry.longName} was not found in ${fileToRead}.`);
        }
      }
      return buildDoseResultsTable(records, deviceName);
    } catch (error) {
      this.logger.error(`Error reading duodose data: ${JSON.stringify(error)}`);
      return undefined;
    } finally {
      this.isDosBusy = false;
    }
  }
}
