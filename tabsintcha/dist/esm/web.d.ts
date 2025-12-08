import { WebPlugin } from '@capacitor/core';
import type { DeleteFileOptions, ExamSubmissionOptions, GetLfnFromSfnOptions, NameOptions, MakeDirectoryOptions, NoiseFeatureChangeLevelOptions, NoiseFeatureStartOptions, QueueExamOptions, ReprogramOptions, RequestCalibrationEntryOptions, RequestDirectoryOptions, RequestSettingOptions, SetBluetoothAdapterStateOptions, SetSoftwareButtonStateOptions, StartCalibrationWriteOptions, StartChaSearchOptions, StartFileReadOptions, StartFileWriteOptions, TabsintChaPlugin, WriteSettingOptions, PermissionStatus } from './definitions';
export declare class TabsintChaWeb extends WebPlugin implements TabsintChaPlugin {
    checkPermissions(options: object): Promise<PermissionStatus>;
    requestPermissions(options: object): Promise<PermissionStatus>;
    getDeviceDiscoveryEventName(options: object): Promise<{
        value: string;
    }>;
    getDeviceResponseEventName(options: object): Promise<{
        value: string;
    }>;
    getBluetoothAdapterState(options: object): Promise<{
        value: string;
    }>;
    setBluetoothAdapterState(options: SetBluetoothAdapterStateOptions): Promise<{
        value: string;
    }>;
    getBuildVersion(options: object): Promise<{
        value: string;
    }>;
    startChaSearch(options: StartChaSearchOptions): Promise<{
        value: string;
    }>;
    cancelChaSearch(options: object): Promise<{
        value: string;
    }>;
    connect(options: NameOptions): Promise<{
        value: string;
    }>;
    disconnect(options: NameOptions): Promise<{
        value: string;
    }>;
    requestAssociatedA2DP(options: NameOptions): Promise<{
        value: string;
    }>;
    startListener(options: NameOptions): Promise<{
        value: string;
    }>;
    stopListener(options: NameOptions): Promise<{
        value: string;
    }>;
    requestCalibrationList(options: NameOptions): Promise<{
        value: string;
    }>;
    requestCalibrationEntry(options: RequestCalibrationEntryOptions): Promise<{
        value: string;
    }>;
    startCalibrationWrite(options: StartCalibrationWriteOptions): Promise<{
        value: string;
    }>;
    requestId(options: NameOptions): Promise<{
        value: string;
    }>;
    requestProbeId(options: NameOptions): Promise<{
        value: string;
    }>;
    requestStatus(options: NameOptions): Promise<{
        value: string;
    }>;
    queueExam(options: QueueExamOptions): Promise<{
        value: string;
    }>;
    examSubmission(options: ExamSubmissionOptions): Promise<{
        value: string;
    }>;
    setSoftwareButtonState(options: SetSoftwareButtonStateOptions): Promise<{
        value: string;
    }>;
    abortExams(options: NameOptions): Promise<{
        value: string;
    }>;
    requestResults(options: NameOptions): Promise<{
        value: string;
    }>;
    requestSdBytesFree(options: NameOptions): Promise<{
        value: string;
    }>;
    reprogram(options: ReprogramOptions): Promise<{
        value: string;
    }>;
    reboot(options: NameOptions): Promise<{
        value: string;
    }>;
    shutdown(options: NameOptions): Promise<{
        value: string;
    }>;
    deleteFile(options: DeleteFileOptions): Promise<{
        value: string;
    }>;
    startFileWrite(options: StartFileWriteOptions): Promise<{
        value: string;
    }>;
    startFileRead(options: StartFileReadOptions): Promise<{
        value: string;
    }>;
    requestDirectory(options: RequestDirectoryOptions): Promise<{
        value: string;
    }>;
    getLfnFromSfn(options: GetLfnFromSfnOptions): Promise<{
        value: string;
    }>;
    makeDirectory(options: MakeDirectoryOptions): Promise<{
        value: string;
    }>;
    cancelFileOperation(options: NameOptions): Promise<{
        value: string;
    }>;
    format(options: NameOptions): Promise<{
        value: string;
    }>;
    a2dpIsPaired(options: NameOptions): Promise<{
        value: string;
    }>;
    a2dpIsConnected(options: NameOptions): Promise<{
        value: string;
    }>;
    a2dpBeginPairing(options: NameOptions): Promise<{
        value: string;
    }>;
    a2dpUnpair(options: NameOptions): Promise<{
        value: string;
    }>;
    a2dpBeginConnection(options: NameOptions): Promise<{
        value: string;
    }>;
    a2dpDisconnect(options: NameOptions): Promise<{
        value: string;
    }>;
    noiseFeatureStart(options: NoiseFeatureStartOptions): Promise<{
        value: string;
    }>;
    noiseFeaturePause(options: NameOptions): Promise<{
        value: string;
    }>;
    noiseFeatureResume(options: NameOptions): Promise<{
        value: string;
    }>;
    noiseFeatureStop(options: NameOptions): Promise<{
        value: string;
    }>;
    noiseFeatureChangeLevel(options: NoiseFeatureChangeLevelOptions): Promise<{
        value: string;
    }>;
    requestSetting(options: RequestSettingOptions): Promise<{
        value: string;
    }>;
    writeSetting(options: WriteSettingOptions): Promise<{
        value: string;
    }>;
    requestExamId(options: NameOptions): Promise<{
        value: string;
    }>;
}
