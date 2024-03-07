import { Injectable } from '@angular/core';
import { StateInterface } from './state.interface';
import { AppState, ProtocolState } from "../../utilities/constants";

@Injectable({
    providedIn: 'root',
})

export class StateModel {

    stateModel: StateInterface = {
        appState: AppState.Welcome,
        protocolState: ProtocolState.null
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