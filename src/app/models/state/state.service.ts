import { Injectable } from '@angular/core';
import { StateInterface } from './state.interface';
import { AppState, ExamState, ProtocolState } from '../../utilities/constants';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class StateModel {
  stateModel: StateInterface = {
    appState: AppState.Welcome,
    protocolState: ProtocolState.null,
    examState: ExamState.NotReady,
    deviceError: [],
    doesResponseExist: false,
    isResponseRequired: false,
    isSubmittable: true,
    examIndex: 0,
    canGoBack: () => {},
    isPaneOpen: {
      general: true,
      advanced: false,
      devices: true,
      tympans: true,
      dosimeter: false,
      softwareHardware: false,
      appLog: false,
      protocols: true,
      protocolsSource: true,
      deviceAdvanced: false,
      completedExams: true,
      exportedAndUploadedResults: true,
    },
    examProgress: {
      //not implemented
      pctProgress: 1,
      anticipatedProtocols: [],
      activatedProtocols: [],
    },
    bluetoothConnected: false,
    wifiConnected: false,
  };

  stateSubject = new BehaviorSubject<StateInterface>(this.stateModel);

  getState(): StateInterface {
    return this.stateModel;
  }

  updateState(updates: Partial<StateInterface>): void {
    this.stateModel = { ...this.stateModel, ...updates };
    this.stateSubject.next(this.stateModel);
  }

  /**
   * Update the wifi status for the state model.
   *
   * @param {boolean} isConnected Whether there is a current wifi connection or not.
   */
  updateWifiStatus(isConnected: boolean) {
    this.updateState({ wifiConnected: isConnected });
  }

  /** Set page isSubmittable state.
   * @summary Checks if a page is submittable and sets isSubmittable state variable
   */
  setPageSubmittable(): void {
    const isSubmittable = !this.stateModel.isResponseRequired || (this.stateModel.isResponseRequired && this.stateModel.doesResponseExist);
    this.updateState({ isSubmittable: isSubmittable });
  }

  updatePaneOpen(paneUpdates: Partial<StateInterface['isPaneOpen']>): void {
    const updatedPanes = { ...this.stateModel.isPaneOpen, ...paneUpdates };
    this.updateState({ isPaneOpen: updatedPanes });
  }
}
