import { AppState, ProtocolState } from "../../utilities/constants";

export interface StateInterface {
    appState: AppState;
    protocolState: ProtocolState
    paneState: {
        general: boolean,
        cha: boolean,
        advanced: boolean
    };
}