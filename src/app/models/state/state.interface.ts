import { AppState, ProtocolState, ExamState, ChaState, SvantekState, TympanState } from "../../utilities/constants";

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
        tympan: boolean;
        wahts: boolean;
        dosimeter: boolean;
        softwareHardware: boolean;
        appLog: boolean;
        protocols: boolean;
        protocolsSource: boolean;
        chaAdvanced: boolean;
        tympanAdvanced: boolean;
        completedExams: boolean;
        exportedAndUploadedResults: boolean;
    };
    examProgress: {
        pctProgress: number;
        anticipatedProtocols: Array<any>;
        activatedProtocols: Array<any>;
    };
    bluetoothConnected: boolean;
    wifiConnected: boolean;
    cha: ChaState;
    tympan: TympanState;
    svantek: SvantekState;
}