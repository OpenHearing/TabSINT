import { inject, Injectable } from '@angular/core';
import { CurrentResults, ExamResults, ResultsInterface } from './results.interface';
import { pageInterfaceDefaults, protocolDefaults } from '../../utilities/defaults';
import { VersionModel } from '../version/version.service';
import { BehaviorSubject } from 'rxjs';
import { Logger } from '../../services/logger.service';
import { DosimeterResultsInterface } from '../../interfaces/dosimeter-results.interface';

@Injectable({
  providedIn: 'root',
})
export class ResultsModel {
  resultsModel: ResultsInterface;
  resultsSubject: BehaviorSubject<ResultsInterface>;

  private readonly versionModel = inject(VersionModel);
  private readonly logger = inject(Logger);

  constructor() {
    this.resultsModel = {
      currentPage: {
        pageId: '',
        page: pageInterfaceDefaults,
      },
      currentExam: {
        protocol: protocolDefaults,
        responses: [],
        softwareVersion: this.versionModel.version,
        tabletLocation: {
          //unimplemented
        },
        hostMetadata: {},
        devices: [],
        calibrationVersion: {},
        flags: {},
      },
    };
    this.resultsSubject = new BehaviorSubject<ResultsInterface>(this.resultsModel);
  }

  getResults(): ResultsInterface {
    return this.resultsModel;
  }

  updateCurrentPage(updates: Partial<CurrentResults>): void {
    this.resultsModel.currentPage = { ...this.resultsModel.currentPage, ...updates };
    this.resultsSubject.next(this.resultsModel);
  }

  updateCurrentExam(updates: Partial<ExamResults>): void {
    this.resultsModel.currentExam = { ...this.resultsModel.currentExam, ...updates };
    this.resultsSubject.next(this.resultsModel);
  }

  pushResponse(response: unknown): void {
    this.resultsModel.currentExam.responses.push(response);
    this.resultsSubject.next(this.resultsModel);
  }

  pushDosimeterData(data: DosimeterResultsInterface): void {
    this.resultsModel.currentPage.dosimetry!.push(data);
    this.resultsSubject.next(this.resultsModel);
  }

  updateCurrentPageResponseElement(index: number, value: unknown): void {
    if (Array.isArray(this.resultsModel.currentPage.response)) {
      const updatedResponse = [...this.resultsModel.currentPage.response];
      updatedResponse[index] = value;
      this.updateCurrentPage({ response: updatedResponse });
    } else {
      // If response is not an array, convert it to an array or handle as needed
      this.logger.warning('Attempting to update array element but response is not an array');
    }
  }
}
