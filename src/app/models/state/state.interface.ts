import { AppState, ProtocolState, ExamState } from "../../utilities/constants";

export interface StateInterface {
    appState: AppState;
    protocolState: ProtocolState;
    examState: ExamState;
    isPaneOpen: {
        general: boolean,
        advanced: boolean,
        wahts: boolean,
        dosimeter: boolean,
        softwareHardware: boolean,
        appLog: boolean,
        protocols: boolean,
        protocolsSource: boolean,
        chaAdvanced: boolean
    };
    examProgress: {
        pctProgress: string
    }
}