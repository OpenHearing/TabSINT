import { Injectable } from '@angular/core';
import { StateInterface } from './state.interface';
import { AppState, ChaState, ExamState, ProtocolState, SvantekState, TympanState } from "../../utilities/constants";

@Injectable({
    providedIn: 'root',
})

export class StateModel {

    stateModel: StateInterface = {
        appState: AppState.Welcome,
        protocolState: ProtocolState.null,
        examState: ExamState.NotReady,
        isSubmittable: true,
        examIndex: 0,
        canGoBack: () => {},
        isPaneOpen: {
            general: true,
            advanced: false,
            devices: false,
            tympans: false,
            dosimeter: false,
            softwareHardware: false,
            appLog: false,
            protocols: true,
            protocolsSource: true,
            deviceAdvanced: false,
            completedExams: true,
            exportedAndUploadedResults: true
        },
        examProgress: {
            pctProgress: 1,
            anticipatedProtocols: [],
            activatedProtocols: []
        },
        bluetoothConnected: false,
        wifiConnected: false,
        newDeviceConnection: false
    }

    getState(): StateInterface {
        return this.stateModel;
    }

    setAppState(_appState: AppState) {
        this.stateModel.appState = _appState;
    }

    setProtocolState(_protocolState: ProtocolState) {
        this.stateModel.protocolState = _protocolState;
    }

}