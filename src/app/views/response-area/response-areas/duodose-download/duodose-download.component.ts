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
    'Peak Sounds Pressure Level (dBP)',
    'Number of Impulses',
    'Device ID',
    'Duration',
    'Start Time',
    // 'Stop Time'
  ];
  resultsValuesDefault = ['', '', '', '', '', '', '', '', ''];

  resultsValues = this.resultsValuesDefault.slice();
  resultsFields = this.resultsFieldsDefault.slice();
  resultsList: any[] = [];

  downloadInProgress = false;
  downloadProgressPercent = 100;
  bytesFree: string | number = 'calculating...';
  bytesFreeUnits = 'B';
  baseDir = '../USER/';
  tmpFileContents = '';
  downloadedLogFiles = [];

  isDosBusy = true;

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
    this.pageSubscription?.unsubscribe();
    this.stateSubscription?.unsubscribe();
    this.resultsSubscription?.unsubscribe();
  }

  async getDosimeterFiles() {
    let dosimeters: IDevice[];

    if (this.tabsintId === undefined) {
      dosimeters = await this.devicesService.getDeviceOrDefault(undefined, [DeviceType.Duodose]);
    } else {
      dosimeters = await this.devicesService.getDeviceOrDefault(this.tabsintId, [DeviceType.Duodose]);
    }

    if (dosimeters.length === 0) {
      this.logger.error('Error with duodose data download: No dosimeter was available.');
      return;
    } else if (dosimeters.length >= 2) {
      this.logger.error('Error with duodose data download: Multiple devices available and one was not specified.');
      return;
    } else {
      this.dosimeter = dosimeters[0];
    }

    const resp1 = await this.devicesService.requestSdBytesFree(this.dosimeter);
    if (resp1?.msg && typeof resp1.msg[1] === 'object' && resp1.msg[1] !== null && 'BytesFree' in resp1.msg[1]) {
      [this.bytesFree, this.bytesFreeUnits] = this.parseFreeSpace(resp1.msg[1].BytesFree as string);
    } else {
      this.logger.error('Error with duodose data download requesting free space.');
      return;
    }

    const resp2 = await this.devicesService.getDirectoryLongNames(this.dosimeter, this.baseDir);
    if (!(resp2?.msg && typeof resp2.msg[1] === 'object' && resp2.msg[1] !== null)) {
      this.logger.error('Error with duodose data download getting directory names.');
      return;
    }

    for (const [key, value] of Object.entries(resp2.msg[1] as any) as any) {
      const re = /_\d{8}T\d{6}\.\d{3}Z_/;
      const ok = re.exec(value);

      if (ok) {
        this.logger.debug('duodose download, regex for filename ok: ' + JSON.stringify(ok));
        const newFile = {
          longName: value,
          selected: false,
          deviceName: value.slice(0, ok.index),
          sessionName: value.slice(ok.index + 22),
          datetime: value.slice(ok.index + 1, ok.index + 21),
          parsedDatetime: this.parseDatetime(value.slice(ok.index + 1, ok.index + 21)).toLocaleString('UTC', { timeZone: 'UTC' }),
        };
        this.availableFiles.push(newFile);
      } else {
        this.logger.debug('duodose download, ignoring file/folder that does not contain data');
        // Not a folder containing data, can be ignored
        // Eventually will want to add log file and CONFIG
      }
    }
    this.isDosBusy = false;
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

  async viewDoseData(): Promise<void> {
    this.resultsFields = this.resultsFieldsDefault.slice();
    this.resultsValues = this.resultsValuesDefault.slice();
    this.resultsList = [];

    if (this.isDosBusy) return;

    const selectedEntries = Object.values(this.availableFiles).filter(entry => entry.selected);
    if (selectedEntries.length === 0) return;

    this.isDosBusy = true;
    this.viewingFile = true;

    const fileToRead = `${selectedEntries[0].deviceName}_Log.csv`;

    try {
      let txt = '';
      const resp = await this.devicesService.copyChaFileToLocalStorageAndReadFile(this.dosimeter!, this.baseDir + fileToRead);
      if (resp?.msg) {
        txt = resp.msg[0] as string;
      }

      const lines = txt.split('\n');
      const csvCommaInQuotes = /"(.*?)"/;

      for (const [index, entry] of selectedEntries.entries()) {
        this.resultsList.push(this.resultsValues.slice());

        const matchingLine = lines.find((line: string) => line.includes(this.parseDatetime(entry.datetime).toISOString()));
        if (!matchingLine) continue;

        const cleanedLine = this.sanitizeCsvLine(matchingLine, csvCommaInQuotes);
        const row = cleanedLine.split(',');

        this.resultsFields[0] = this.stripQuotes(row[6]);
        this.resultsList[index][0] = Number.parseFloat(row[7]).toString();
        this.resultsFields[1] = this.stripQuotes(row[8]);
        this.resultsList[index][1] = row[9];
        this.resultsFields[2] = this.stripQuotes(row[10]);
        this.resultsList[index][2] = row[11];
        this.resultsFields[3] = this.stripQuotes(row[12]);
        this.resultsList[index][3] = row[13];

        this.resultsList[index][4] = row[15]; // peak level
        this.resultsList[index][5] = row[14]; // num impulses
        this.resultsList[index][6] = selectedEntries[0].deviceName; // device id
        this.resultsList[index][7] = row[5]; // run time
        this.resultsList[index][8] = new Date(this.stripQuotes(row[4])).toLocaleString('UTC', { timeZone: 'UTC' }); // start time
      }

      this.resultsValues = this.combineResults(this.resultsList, this.resultsFields);
    } catch (error) {
      this.resultsFields = this.resultsFieldsDefault.slice();
      this.resultsValues = this.resultsValuesDefault.slice();
      this.logger.debug(`Error viewing dose data: ${JSON.stringify(error)}`);
    } finally {
      this.isDosBusy = false;
    }
  }

  private stripQuotes(value: string): string {
    return value.slice(1, -1);
  }

  private sanitizeCsvLine(line: string, re: RegExp): string {
    let result = line;
    let ind = 0;
    while (ind < result.length) {
      const match = re.exec(result.slice(ind));
      if (match) {
        if (match[0].includes(',')) {
          result = this.replaceAt(result, ind + match.index, match[0].replace(',', ' '));
        }
        ind += match.index + match[0].length;
      } else {
        break;
      }
    }
    return result;
  }

  replaceAt(string: string, index: number, replacement: string) {
    return string.substring(0, index) + replacement + string.substring(index + replacement.length);
  }

  combineResults(arr: any[][], headers: string[]): any[] {
    const combined: any[] = Array.from(new Array(arr[0].length), () => 0);
    const durations: number[] = [];
    const LAeq8hrs: number[] = [];
    const LAeqSessions: number[] = [];
    const LCeqSessions: number[] = [];
    const LZeqSessions: number[] = [];

    const collectValues = (header: string, value: string, j: number) => {
      const parsedValue = Number.parseFloat(value);
      const collectors: Record<string, () => void> = {
        'LAeq 8hr': () => LAeq8hrs.push(parsedValue),
        'LAeq session': () => LAeqSessions.push(parsedValue),
        'LCeq session': () => LCeqSessions.push(parsedValue),
        'LZeq session': () => LZeqSessions.push(parsedValue),
        'Peak Sounds Pressure Level (dBP)': () => {
          if (parsedValue > combined[j]) combined[j] = parsedValue;
        },
        'Number of Impulses': () => {
          combined[j] += parsedValue;
        },
        'Device ID': () => {
          combined[j] = value;
        },
        Duration: () => durations.push(parsedValue),
        'Start Time': () => {
          if (combined[j] === 0 || Date.parse(value) < Date.parse(combined[j])) {
            combined[j] = value;
          }
        },
      };
      collectors[header]?.();
    };

    const assignCombined = (header: string, j: number) => {
      const totalDuration = durations.reduce((sum, a) => sum + a, 0);
      const assignments: Record<string, () => void> = {
        'LAeq 8hr': () => {
          combined[j] = this.calculateTotalDoseDB(LAeq8hrs);
        },
        'LAeq session': () => {
          combined[j] = this.calculateAverageLevelDB(LAeqSessions, durations);
        },
        'LCeq session': () => {
          combined[j] = this.calculateAverageLevelDB(LCeqSessions, durations);
        },
        'LZeq session': () => {
          combined[j] = this.calculateAverageLevelDB(LZeqSessions, durations);
        },
        Duration: () => {
          combined[j] = this.parseDuration(totalDuration);
        },
      };
      assignments[header]?.();
    };

    for (const row of arr) {
      for (const [j, value] of row.entries()) {
        collectValues(headers[j], value, j);
      }
    }

    for (const [j, header] of headers.entries()) {
      assignCombined(header, j);
    }

    return combined;
  }

  calculateTotalDoseDB(L_dB: number[]): number {
    const session_exposure = L_dB.map(item => 10 ** (item / 10));
    const total_exposure = session_exposure.reduce((partialSum, a) => partialSum + a, 0);
    const L_dB_total = 10 * Math.log10(total_exposure);
    return Math.round((L_dB_total + Number.EPSILON) * 100) / 100;
  }

  calculateAverageLevelDB(L_dB: number[], dur: number[]): number {
    const session_exposure = L_dB.map((item, i) => 10 ** (item / 10) * dur[i]);
    const average_exposure = session_exposure.reduce((partialSum1, a1) => partialSum1 + a1, 0) / dur.reduce((partialSum2, a2) => partialSum2 + a2, 0);
    const L_dB_total = 10 * Math.log10(average_exposure);
    return Math.round((L_dB_total + Number.EPSILON) * 100) / 100;
  }

  parseDuration(duration: number): string {
    const MINUTE = 60;
    const HOUR = MINUTE * 60;
    const DAY = HOUR * 24;
    const YEAR = DAY * 365;

    const thresholds = [
      { limit: MINUTE, divisor: 1, unit: 'sec' },
      { limit: HOUR, divisor: MINUTE, unit: 'min' },
      { limit: DAY, divisor: HOUR, unit: 'hours' },
      { limit: YEAR, divisor: DAY, unit: 'days' },
    ];

    const match = thresholds.find(({ limit }) => duration < limit);
    if (!match) return '';

    const val = Math.round((duration / match.divisor) * 10) / 10;
    return `${val} ${match.unit}`;
  }

  async addDoseDataToResults(): Promise<void> {
    this.resultsFields = this.resultsFieldsDefault.slice();
    this.resultsList = [];

    if (this.isDosBusy) return;

    const selectedEntries = Object.values(this.availableFiles).filter(entry => entry.selected);
    if (selectedEntries.length === 0) return;

    this.isDosBusy = true;
    this.viewingFile = true;

    const fileToRead = `${selectedEntries[0].deviceName}_Log.csv`;

    try {
      let txt = '';
      const resp = await this.devicesService.copyChaFileToLocalStorageAndReadFile(this.dosimeter!, this.baseDir + fileToRead);
      if (resp?.msg) {
        txt = resp.msg[0] as string;
      }

      const lines = txt.split('\n');
      const csvCommaInQuotes = /"(.*?)"/;

      for (const [index, entry] of selectedEntries.entries()) {
        this.resultsList.push(this.resultsValuesDefault.slice());

        const matchingLine = lines.find((line: string) => line.includes(this.parseDatetime(entry.datetime).toISOString()));
        if (!matchingLine) continue;

        const cleanedLine = this.sanitizeCsvLine(matchingLine, csvCommaInQuotes);
        const row = cleanedLine.split(',');

        this.resultsFields[0] = this.stripQuotes(row[6]);
        this.resultsList[index][0] = Number.parseFloat(row[7]).toString();
        this.resultsFields[1] = this.stripQuotes(row[8]);
        this.resultsList[index][1] = row[9];
        this.resultsFields[2] = this.stripQuotes(row[10]);
        this.resultsList[index][2] = row[11];
        this.resultsFields[3] = this.stripQuotes(row[12]);
        this.resultsList[index][3] = row[13];

        this.resultsList[index][4] = row[15]; // peak level
        this.resultsList[index][5] = row[14]; // num impulses
        this.resultsList[index][6] = selectedEntries[0].deviceName; // device id
        this.resultsList[index][7] = row[5]; // run time
        this.resultsList[index][8] = new Date(this.stripQuotes(row[4])).toLocaleString('UTC', { timeZone: 'UTC' }); // start time
      }

      this.results.currentPage.response = {
        headers: this.resultsFields,
        sessions: this.resultsList,
        combined: this.combineResults(this.resultsList, this.resultsFields),
      };
      this.resultsModel.updateCurrentPage({ response: this.results.currentPage.response });
    } finally {
      this.isDosBusy = false;
    }
  }
}
