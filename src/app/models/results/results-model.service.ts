import { Injectable } from '@angular/core';
import { CurrentResults, ExamResults, ResultsInterface } from './results.interface';
import { pageInterfaceDefaults, protocolDefaults } from '../../utilities/defaults';
import { DevicesModel } from '../devices/devices-model.service';
import { VersionModel } from '../version/version.service';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ResultsModel {
  resultsModel: ResultsInterface;
  resultsSubject: BehaviorSubject<ResultsInterface>;

  constructor(
    private readonly devicesModel: DevicesModel,
    private readonly versionModel: VersionModel
  ) {
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
        devices: this.devicesModel.getDevices(),
        calibrationVersion: '0.0',
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

  pushResponse(response: any): void {
    console.log('results-model.service pushResponse');
    this.resultsModel.currentExam.responses.push(response);
    this.resultsSubject.next(this.resultsModel);
  }

  updateCurrentPageResponseElement(index: number, value: any): void {
    if (Array.isArray(this.resultsModel.currentPage.response)) {
      const updatedResponse = [...this.resultsModel.currentPage.response];
      updatedResponse[index] = value;
      this.updateCurrentPage({ response: updatedResponse });
    } else {
      // If response is not an array, convert it to an array or handle as needed
      console.warn('Attempting to update array element but response is not an array');
    }
  }
}
