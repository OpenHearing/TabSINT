import { AppState, ProtocolState, ExamState, ChaState } from "../../utilities/constants";

export interface StateInterface {
    appState: AppState;
    protocolState: ProtocolState;
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
        completedExams: boolean;
        exportedAndUploadedResults: boolean;
    };
    examProgress: {
        pctProgress: number;
        anticipatedProtocols: Array<any>;
        activatedProtocols: Array<any>;
    };
    bluetoothConnected: boolean;
    cha: ChaState;
}