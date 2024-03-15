import { AppState, ProtocolState } from "../../utilities/constants";

export interface StateInterface {
    appState: AppState;
    protocolState: ProtocolState
    isPaneOpen: {
        general: boolean,
        advanced: boolean,
        wahts: boolean,
        dosimeter: boolean,
        softwareHardware: boolean,
        appLog: boolean,
        protocols: boolean,
        protocolsSource: boolean
    };
}