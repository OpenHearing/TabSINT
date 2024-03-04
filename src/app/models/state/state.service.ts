import { Injectable } from '@angular/core';
import { StateModel } from './state.interface';
import { AppState, ProtocolState } from "../../utilities/constants";

@Injectable({
    providedIn: 'root',
})

export class StateM {

    stateM: StateModel = {
        appState: AppState.Welcome,
        protocolState: ProtocolState.null
    }

    getState(): StateModel {
        return this.stateM;
    }

    setAppState(_appState: AppState) {
        this.stateM.appState = _appState;
    }

    setProtocolState(_protocolState: ProtocolState) {
        this.stateM.protocolState = _protocolState;
    }

}