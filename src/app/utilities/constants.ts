export enum AppState {
  Welcome,
  Admin,
  Exam,
  null,
}

export enum ProtocolState {
  null,
  Ready,
  InProgress,
}

export enum ExamState {
  NotReady,
  Finalized,
  Ready,
  Testing,
  DeviceError,
}

export enum DeviceState {
  Connected = 'Connected',
  Disconnected = 'Disconnected',
  Discovery = 'Discovery',
  Reprogram = 'Reprogram',
}

export enum DeviceStatus {
  Ready = 'Ready',
  Busy = 'Busy',
  Error = 'Error',
}

export enum DeviceType {
  Tympan = 'Tympan',
  Wahts = 'WAHTS',
  Duodose = 'DuoDose',
  Svantek = 'Svantek',
}

import { WahtsDevice } from '../models/devices/wahts-device';
import { DuodoseDevice } from '../models/devices/duodose-device';
export type ChaDeviceType = WahtsDevice | DuodoseDevice;

export enum Headset {
  None = 'None',
  Audiometer = 'Audiometer',
  HDA200 = 'HDA200',
  VicFirth = 'VicFirth',
  VicFirthS2 = 'VicFirthS2',
  WAHTS = 'WAHTS',
}

export enum Tablet {
  Nexus7 = 'Nexus 7',
  TabE = 'TabE',
}

export enum ResultsMode {
  UploadOnly = 'Upload Only',
  ExportOnly = 'Export Only',
  UploadAndExport = 'Upload and Export',
}

export enum ProtocolServer {
  LocalServer = 'Local Server',
  Gitlab = 'Gitlab',
  Developer = 'Developer',
}

export enum DialogType {
  Confirm,
  Alert,
}

export enum MediaUpdateStatus {
  Skipped = 'Skipped',
  UpToDate = 'UpToDate',
  Updated = 'Updated',
  Failed = 'Failed',
}

export enum SvantekState {
  Connected,
  Disconnected,
  Recording,
}

export enum BluetoothType {
  BLUETOOTH_LE = 'BLE',
  USB = 'USB',
}

export enum CalibrationFilter {
  Full = 'full',
  Flat = 'flat',
}

export enum PlaybackMethod {
  AsRecorded = 'as-recorded',
  Arbitrary = 'arbitrary',
}

export enum WavfileWeighting {
  A = 'A',
  C = 'C',
  Z = 'Z',
}

export const LevelUnits = {
  dB_SPL: 'dB SPL',
  dB_HL: 'dB HL',
};

// import PurdueShakedown from '../../assets/protocols/purdue-shakedown/protocol.json';
import develop from '../../assets/protocols/develop/protocol.json';
import mini_pcc from '../../assets/protocols/mini_pcc/protocol.json';
import { ProtocolSchemaInterface } from '../interfaces/protocol-schema.interface';
export const DeveloperProtocols: Record<string, ProtocolSchemaInterface> = {
  // "Purdue Shakedown": PurdueShakedown,
  develop: develop as unknown as ProtocolSchemaInterface,
  mini_pcc: mini_pcc as unknown as ProtocolSchemaInterface,
};

import WahtsDeviceTestCalibration from '../../assets/protocols/wahts-device-test/calibration.json';
import DevelopCalibration from '../../assets/protocols/develop/calibration.json';
import { CalibrationFileInterface } from '../interfaces/calibration-file.interface';
export const DeveloperProtocolsCalibration: Record<string, CalibrationFileInterface> = {
  'wahts-device-test': WahtsDeviceTestCalibration as unknown as CalibrationFileInterface,
  develop: DevelopCalibration as unknown as CalibrationFileInterface,
};

export const bluetoothTimeout = 5000;

export const listOfTabsintDirectories: string[] = [
  '.tabsint-results-backup',
  // ".tabsint-uuid",
  'tabsint-configuration',
  'tabsint-logs',
  'tabsint-pdfs',
  'tabsint-protocols',
  'tabsint-results',
];

export const createResultsTableSql = 'CREATE TABLE IF NOT EXISTS results (msgID INTEGER PRIMARY KEY AUTOINCREMENT, data TEXT)';
export const createLogsTableSql = 'CREATE TABLE IF NOT EXISTS logs (msgID INTEGER PRIMARY KEY AUTOINCREMENT, data TEXT)';
export const deleteOldLogsSql = 'DELETE FROM logs WHERE logs.msgID IN (SELECT msgID FROM logs ORDER BY msgID LIMIT ?);';

export const ResultType_Threshold = 'Threshold';
export const ResultType_Outside = 'Hearing Potentially Outside Measurable Range';
export const ResultType_DNC = 'Failed to Converge'; // DNC: Did Not Converge
export const ResultType_Better = 'Hearing Potentially Better the Calibrated Range';
export const ResultType_Beyond = 'Hearing Potentially Beyond the Calibrated Range';
export const ResultType_MaximumMaskingLevel = 'Maximum Masking Level Reached. Could Not Determine Threshold';
export const ResultType_MaskinDilemma = 'Could Not Mask Due To Masking Dilemma';

export enum ResultType {
  Threshold = 'Threshold',
  Better = 'Hearing Potentially Better the Calibrated Range',
  Beyond = 'Hearing Potentially Beyond the Calibrated Range',
  DNC = 'Failed to Converge',
}

export enum AudioChannel {
  Left = 'left',
  Right = 'right',
  Mono = 'mono',
}

export enum ButtonAlignment {
  Left = 'left',
  Right = 'right',
  Center = 'center',
  Justify = 'justify',
  Start = 'start',
  End = 'end',
}
