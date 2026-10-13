import { WebPlugin } from '@capacitor/core';

import type {
  DeleteFileOptions,
  ExamSubmissionOptions,
  GetLfnFromSfnOptions,
  NameOptions,
  MakeDirectoryOptions,
  NoiseFeatureChangeLevelOptions,
  NoiseFeatureStartOptions,
  QueueExamOptions,
  ReprogramOptions,
  RequestCalibrationEntryOptions,
  RequestDirectoryOptions,
  RequestSettingOptions,
  SetBluetoothAdapterStateOptions,
  SetSoftwareButtonStateOptions,
  StartCalibrationWriteOptions,
  StartChaSearchOptions,
  StartFileReadOptions,
  StartFileWriteOptions,
  TabsintChaPlugin,
  WriteSettingOptions,
  PermissionStatus,
} from './definitions';

export class TabsintChaWeb extends WebPlugin implements TabsintChaPlugin {
  async checkPermissions(options: object): Promise<PermissionStatus> {
    console.log('checkPermissions not implemented for web:' + JSON.stringify(options));
    throw this.unimplemented('checkPermissions not implemented for web');
  }
  async requestPermissions(options: object): Promise<PermissionStatus> {
    console.log('requestPermissions not implemented for web:' + JSON.stringify(options));
    throw this.unimplemented('requestPermissions not implemented for web');
  }
  async getDeviceDiscoveryEventName(options: object): Promise<{ value: string }> {
    console.log('getDeviceDiscoveryEventName not implemented for web:' + JSON.stringify(options));
    throw this.unimplemented('getDeviceDiscoveryEventName not implemented for web');
  }
  async getDeviceResponseEventName(options: object): Promise<{ value: string }> {
    console.log('getDeviceResponseEventName not implemented for web:' + JSON.stringify(options));
    throw this.unimplemented('getDeviceResponseEventName not implemented for web');
  }
  async getBluetoothAdapterState(options: object): Promise<{ value: string }> {
    console.log('getBluetoothAdapterState not implemented for web:' + JSON.stringify(options));
    throw this.unimplemented('getBluetoothAdapterState not implemented for web');
  }
  async setBluetoothAdapterState(options: SetBluetoothAdapterStateOptions): Promise<{ value: string }> {
    console.log('setBluetoothAdapterState not implemented for web: ' + JSON.stringify(options));
    throw this.unimplemented('setBluetoothAdapterState not implemented for web');
  }
  async getBuildVersion(options: object): Promise<{ value: string }> {
    console.log('getBuildVersion not implemented for web: ' + JSON.stringify(options));
    throw this.unimplemented('getBuildVersion not implemented for web');
  }
  async startChaSearch(options: StartChaSearchOptions): Promise<{ value: string }> {
    console.log('startChaSearch not implemented for web: ' + JSON.stringify(options));
    throw this.unimplemented('startChaSearch not implemented for web');
  }
  async cancelChaSearch(options: object): Promise<{ value: string }> {
    console.log('cancelChaSearch not implemented for web: ' + JSON.stringify(options));
    throw this.unimplemented('cancelChaSearch not implemented for web');
  }
  async connect(options: NameOptions): Promise<{ value: string }> {
    console.log('connect not implemented for web: ' + JSON.stringify(options));
    throw this.unimplemented('connect not implemented for web');
  }
  async disconnect(options: NameOptions): Promise<{ value: string }> {
    console.log('disconnect not implemented for web: ' + JSON.stringify(options));
    throw this.unimplemented('disconnect not implemented for web');
  }
  async requestAssociatedA2DP(options: NameOptions): Promise<{ value: string }> {
    console.log('requestAssociatedA2DP not implemented for web: ' + JSON.stringify(options));
    throw this.unimplemented('requestAssociatedA2DP not implemented for web');
  }
  async startListener(options: NameOptions): Promise<{ value: string }> {
    console.log('startListener not implemented for web: ' + JSON.stringify(options));
    throw this.unimplemented('startListener not implemented for web');
  }
  async stopListener(options: NameOptions): Promise<{ value: string }> {
    console.log('stopListener not implemented for web: ' + JSON.stringify(options));
    throw this.unimplemented('stopListener not implemented for web');
  }
  async requestCalibrationList(options: NameOptions): Promise<{ value: string }> {
    console.log('requestCalibrationList not implemented for web: ' + JSON.stringify(options));
    throw this.unimplemented('requestCalibrationList not implemented for web');
  }
  async requestCalibrationEntry(options: RequestCalibrationEntryOptions): Promise<{ value: string }> {
    console.log('requestCalibrationEntry not implemented for web: ' + JSON.stringify(options));
    throw this.unimplemented('requestCalibrationEntry not implemented for web');
  }
  async startCalibrationWrite(options: StartCalibrationWriteOptions): Promise<{ value: string }> {
    console.log('startCalibrationWrite not implemented for web: ' + JSON.stringify(options));
    throw this.unimplemented('startCalibrationWrite not implemented for web');
  }
  async requestId(options: NameOptions): Promise<{ value: string }> {
    console.log('requestId not implemented for web: ' + JSON.stringify(options));
    throw this.unimplemented('requestId not implemented for web');
  }
  async requestProbeId(options: NameOptions): Promise<{ value: string }> {
    console.log('requestProbeId not implemented for web: ' + JSON.stringify(options));
    throw this.unimplemented('requestProbeId not implemented for web');
  }
  async requestStatus(options: NameOptions): Promise<{ value: string }> {
    console.log('requestStatus not implemented for web: ' + JSON.stringify(options));
    throw this.unimplemented('requestStatus not implemented for web');
  }
  async queueExam(options: QueueExamOptions): Promise<{ value: string }> {
    console.log('queueExam not implemented for web: ' + JSON.stringify(options));
    throw this.unimplemented('queueExam not implemented for web');
  }
  async examSubmission(options: ExamSubmissionOptions): Promise<{ value: string }> {
    console.log('examSubmission not implemented for web: ' + JSON.stringify(options));
    throw this.unimplemented('examSubmission not implemented for web');
  }
  async setSoftwareButtonState(options: SetSoftwareButtonStateOptions): Promise<{ value: string }> {
    console.log('setSoftwareButtonState not implemented for web: ' + JSON.stringify(options));
    throw this.unimplemented('setSoftwareButtonState not implemented for web');
  }
  async abortExams(options: NameOptions): Promise<{ value: string }> {
    console.log('abortExams not implemented for web: ' + JSON.stringify(options));
    throw this.unimplemented('abortExams not implemented for web');
  }
  async requestResults(options: NameOptions): Promise<{ value: string }> {
    console.log('requestResults not implemented for web: ' + JSON.stringify(options));
    throw this.unimplemented('requestResults not implemented for web');
  }
  async requestSdBytesFree(options: NameOptions): Promise<{ value: string }> {
    console.log('requestSdBytesFree not implemented for web: ' + JSON.stringify(options));
    throw this.unimplemented('requestSdBytesFree not implemented for web');
  }
  async reprogram(options: ReprogramOptions): Promise<{ value: string }> {
    console.log('reprogram not implemented for web: ' + JSON.stringify(options));
    throw this.unimplemented('reprogram not implemented for web');
  }
  async reboot(options: NameOptions): Promise<{ value: string }> {
    console.log('reboot not implemented for web: ' + JSON.stringify(options));
    throw this.unimplemented('reboot not implemented for web');
  }
  async shutdown(options: NameOptions): Promise<{ value: string }> {
    console.log('shutdown not implemented for web: ' + JSON.stringify(options));
    throw this.unimplemented('shutdown not implemented for web');
  }
  async deleteFile(options: DeleteFileOptions): Promise<{ value: string }> {
    console.log('deleteFile not implemented for web: ' + JSON.stringify(options));
    throw this.unimplemented('deleteFile not implemented for web');
  }
  async startFileWrite(options: StartFileWriteOptions): Promise<{ value: string }> {
    console.log('startFileWrite not implemented for web: ' + JSON.stringify(options));
    throw this.unimplemented('startFileWrite not implemented for web');
  }
  async startFileRead(options: StartFileReadOptions): Promise<{ value: string }> {
    console.log('startFileRead not implemented for web: ' + JSON.stringify(options));
    throw this.unimplemented('startFileRead not implemented for web');
  }
  async requestDirectory(options: RequestDirectoryOptions): Promise<{ value: string }> {
    console.log('requestDirectory not implemented for web: ' + JSON.stringify(options));
    throw this.unimplemented('requestDirectory not implemented for web');
  }
  async getLfnFromSfn(options: GetLfnFromSfnOptions): Promise<{ value: string }> {
    console.log('getLfnFromSfn not implemented for web: ' + JSON.stringify(options));
    throw this.unimplemented('getLfnFromSfn not implemented for web');
  }
  async makeDirectory(options: MakeDirectoryOptions): Promise<{ value: string }> {
    console.log('makeDirectory not implemented for web: ' + JSON.stringify(options));
    throw this.unimplemented('makeDirectory not implemented for web');
  }
  async cancelFileOperation(options: NameOptions): Promise<{ value: string }> {
    console.log('cancelFileOperation not implemented for web: ' + JSON.stringify(options));
    throw this.unimplemented('cancelFileOperation not implemented for web');
  }
  async format(options: NameOptions): Promise<{ value: string }> {
    console.log('format not implemented for web: ' + JSON.stringify(options));
    throw this.unimplemented('format not implemented for web');
  }
  async a2dpIsPaired(options: NameOptions): Promise<{ value: string }> {
    console.log('a2dpIsPaired not implemented for web: ' + JSON.stringify(options));
    throw this.unimplemented('a2dpIsPaired not implemented for web');
  }
  async a2dpIsConnected(options: NameOptions): Promise<{ value: string }> {
    console.log('a2dpIsConnected not implemented for web: ' + JSON.stringify(options));
    throw this.unimplemented('a2dpIsConnected not implemented for web');
  }
  async a2dpBeginPairing(options: NameOptions): Promise<{ value: string }> {
    console.log('a2dpBeginPairing not implemented for web: ' + JSON.stringify(options));
    throw this.unimplemented('a2dpBeginPairing not implemented for web');
  }
  async a2dpUnpair(options: NameOptions): Promise<{ value: string }> {
    console.log('a2dpUnpair not implemented for web: ' + JSON.stringify(options));
    throw this.unimplemented('a2dpUnpair not implemented for web');
  }
  async a2dpBeginConnection(options: NameOptions): Promise<{ value: string }> {
    console.log('a2dpBeginConnection not implemented for web: ' + JSON.stringify(options));
    throw this.unimplemented('a2dpBeginConnection not implemented for web');
  }
  async a2dpDisconnect(options: NameOptions): Promise<{ value: string }> {
    console.log('a2dpDisconnect not implemented for web: ' + JSON.stringify(options));
    throw this.unimplemented('a2dpDisconnect not implemented for web');
  }
  async noiseFeatureStart(options: NoiseFeatureStartOptions): Promise<{ value: string }> {
    console.log('noiseFeatureStart not implemented for web: ' + JSON.stringify(options));
    throw this.unimplemented('noiseFeatureStart not implemented for web');
  }
  async noiseFeaturePause(options: NameOptions): Promise<{ value: string }> {
    console.log('noiseFeaturePause not implemented for web: ' + JSON.stringify(options));
    throw this.unimplemented('noiseFeaturePause not implemented for web');
  }
  async noiseFeatureResume(options: NameOptions): Promise<{ value: string }> {
    console.log('noiseFeatureResume not implemented for web: ' + JSON.stringify(options));
    throw this.unimplemented('noiseFeatureResume not implemented for web');
  }
  async noiseFeatureStop(options: NameOptions): Promise<{ value: string }> {
    console.log('noiseFeatureStop not implemented for web: ' + JSON.stringify(options));
    throw this.unimplemented('noiseFeatureStop not implemented for web');
  }
  async noiseFeatureChangeLevel(options: NoiseFeatureChangeLevelOptions): Promise<{ value: string }> {
    console.log('noiseFeatureChangeLevel not implemented for web: ' + JSON.stringify(options));
    throw this.unimplemented('noiseFeatureChangeLevel not implemented for web');
  }
  async requestSetting(options: RequestSettingOptions): Promise<{ value: string }> {
    console.log('requestSetting not implemented for web: ' + JSON.stringify(options));
    throw this.unimplemented('requestSetting not implemented for web');
  }
  async writeSetting(options: WriteSettingOptions): Promise<{ value: string }> {
    console.log('writeSetting not implemented for web: ' + JSON.stringify(options));
    throw this.unimplemented('writeSetting not implemented for web');
  }
  async requestExamId(options: NameOptions): Promise<{ value: string }> {
    console.log('requestExamId not implemented for web: ' + JSON.stringify(options));
    throw this.unimplemented('requestExamId not implemented for web');
  }
}
