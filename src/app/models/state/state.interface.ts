import { AppState, ProtocolState } from "../../utilities/constants";

export interface StateInterface {
    appState: AppState;
    protocolState: ProtocolState
    isPaneOpen: {
        general: boolean,
        wahts: boolean,
        advanced: boolean,
        protocols: boolean,
        protocolsSource: boolean
    };
}