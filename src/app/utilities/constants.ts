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

export enum ResultsMode {
    UploadOnly = "Upload Only",
    ExportOnly = "Export Only",
    UploadAndExport = "Upload and Export"
}

export enum ProtocolServer {
    LocalServer,
    Gitlab,
    Developer
}

export enum DialogType {
    Confirm,
    Alert
}

import EdareAudiometry from '../../protocols/edare-audiometry/protocol.json';
import CreareAudiometry from '../../protocols/creare-audiometry/protocol.json';
import TabsintTest from '../../protocols/tabsint-test/protocol.json';
import WahtsDeviceTest from '../../protocols/wahts-device-test/protocol.json';
import WahtsSoftwareTest from '../../protocols/wahts-software-test/protocol.json';
import develop from '../../protocols/develop/protocol.json';
export var DeveloperProtocols: any = {
    "Audiometry": EdareAudiometry,
    "Creare Audiometry": CreareAudiometry,
    "tabsint-test": TabsintTest,
    "wahts-device-test": WahtsDeviceTest,
    "wahts-software-test" : WahtsSoftwareTest,
    "develop" : develop
}

import WahtsDeviceTestCalibration from '../../protocols/wahts-device-test/calibration.json';
import WahtsSoftwareTestCalibration from '../../protocols/wahts-software-test/calibration.json';
export var DeveloperProtocolsCalibration: any = {
    "wahts-device-test": WahtsDeviceTestCalibration,
    "wahts-software-test" : WahtsSoftwareTestCalibration
}

export const bluetoothTimeout: number = 5000;