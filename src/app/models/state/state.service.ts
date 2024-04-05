import { Injectable } from '@angular/core';
import { StateInterface } from './state.interface';
import { AppState, ExamState, ProtocolState } from "../../utilities/constants";

@Injectable({
    providedIn: 'root',
})

export class StateModel {

    stateModel: StateInterface = {
        appState: AppState.Welcome,
        protocolState: ProtocolState.null,
        protocolStack: [],
        examState: ExamState.NotReady,
        isSubmittable: true,
        examIndex: 0,
        canGoBack: () => {},
        isPaneOpen: {
            general: true,
            advanced: false,
            wahts: false,
            dosimeter: false,
            softwareHardware: false,
            appLog: false,
            protocols: true,
            protocolsSource: true,
            chaAdvanced: false
        },
        examProgress: {
            pctProgress: 1,
            anticipatedProtocols: [],
            activatedProtocols: []
        }
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