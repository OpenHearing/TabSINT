import { AppState, ProtocolState, ExamState } from '../../utilities/constants';

export interface StateInterface {
  appState: AppState;
  protocolState: ProtocolState;
  examState: ExamState;
  deviceError: any[];
  doesResponseExist: boolean;
  isResponseRequired: boolean;
  isSubmittable: boolean;
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
  examProgress: number | string;
  bluetoothConnected: boolean;
  wifiConnected: boolean;
}
