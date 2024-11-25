export enum AppState {
    Welcome,
    Admin,
    Exam,
    null
}

export enum ProtocolState {
    null,
    Ready,
    InProgress
}

export enum ExamState {
    NotReady,
    Finalized,
    Ready,
    Testing
}

export enum DeviceState {
    Connected,
    Disconnected,
    Discovery,
    Reprogram
}

export const AvailableConnectableDevices: Array<string> = [
    "Tympan",
    // "CHA",
    // "Svantek"
]

export enum ResultsMode {
    UploadOnly = "Upload Only",
    ExportOnly = "Export Only",
    UploadAndExport = "Upload and Export"
}

export enum ProtocolServer {
    LocalServer = "Local Server",
    Gitlab = "Gitlab",
    Developer = "Developer"
}

export enum DialogType {
    Confirm,
    Alert
}

export enum SvantekState {
    Connected,
    Disconnected,
    Recording
}

export const BluetoothType = {
  "BLUETOOTH": "Bluetooth 2.0",
  "BLUETOOTH_LE": "Bluetooth 3.0",
  "USB": "USB Host"
};

export const LevelUnits = {
    "dB_SPL": "dB SPL",
    "dB_HL": "dB HL"
}


import PurdueDemo from '../../protocols/purdue-demo/protocol.json';
import develop from '../../protocols/develop/protocol.json';
export const DeveloperProtocols: any = {
    "Purdue Demo": PurdueDemo,
    "develop" : develop
}

import WahtsDeviceTestCalibration from '../../protocols/wahts-device-test/calibration.json';
export const DeveloperProtocolsCalibration: any = {
    "wahts-device-test": WahtsDeviceTestCalibration
}

export const bluetoothTimeout: number = 5000;

export const listOfTabsintDirectories: Array<string> = [
    ".tabsint-results-backup",
    // ".tabsint-uuid",
    "tabsint-configuration",
    "tabsint-logs",
    "tabsint-pdfs",
    "tabsint-protocols",
    "tabsint-results"
]

export const createResultsTableSql =  "CREATE TABLE IF NOT EXISTS results (msgID INTEGER PRIMARY KEY AUTOINCREMENT, data TEXT)";
export const createLogsTableSql =  "CREATE TABLE IF NOT EXISTS logs (msgID INTEGER PRIMARY KEY AUTOINCREMENT, data TEXT)";
export const deleteSql = "DELETE FROM logs WHERE logs.msgID IN (SELECT msgID FROM logs ORDER BY date LIMIT ?);";