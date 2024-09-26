import { AppState, ProtocolState, ExamState, ChaState, SvantekState, TympanState } from "../../utilities/constants";
import { ProtocolInterface } from "../protocol/protocol.interface";

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
        devices: boolean;
        tympans: boolean;
        dosimeter: boolean;
        softwareHardware: boolean;
        appLog: boolean;
        protocols: boolean;
        protocolsSource: boolean;
        deviceAdvanced: boolean;
        completedExams: boolean;
        exportedAndUploadedResults: boolean;
    };
    examProgress: {
        pctProgress: number;
        anticipatedProtocols: Array<ProtocolInterface>;
        activatedProtocols: Array<ProtocolInterface>;
    };
    bluetoothConnected: boolean;
    wifiConnected: boolean;
    newDeviceConnection: boolean;
}