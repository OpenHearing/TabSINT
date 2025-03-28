import { AppState, ProtocolState, ExamState } from "../../utilities/constants";
import { ProtocolInterface } from "../protocol/protocol.interface";

export interface StateInterface {
    appState: AppState;
    protocolState: ProtocolState;
    examState: ExamState;
    deviceError: Array<any>;
    doesResponseExist: boolean;
    isResponseRequired: boolean;
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