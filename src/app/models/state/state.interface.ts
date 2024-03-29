import { AppState, ProtocolState, ExamState } from "../../utilities/constants";

export interface StateInterface {
    appState: AppState;
    protocolState: ProtocolState;
    protocolStack: Array<any>;
    examState: ExamState;
    isSubmittable: boolean;
    examIndex: number;
    canGoBack: Function;
    isPaneOpen: {
        general: boolean;
        advanced: boolean;
        wahts: boolean;
        dosimeter: boolean;
        softwareHardware: boolean;
        appLog: boolean;
        protocols: boolean;
        protocolsSource: boolean;
        chaAdvanced: boolean;
    };
    examProgress: {
        pctProgress: number;
        anticipatedProtocols: Array<any>;
        activatedProtocols: Array<any>;
    }
}