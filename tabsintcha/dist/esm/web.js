import { WebPlugin } from '@capacitor/core';
export class TabsintChaWeb extends WebPlugin {
    async checkPermissions(options) {
        console.log('checkPermissions not implemented for web:' + JSON.stringify(options));
        throw this.unimplemented('checkPermissions not implemented for web');
    }
    async requestPermissions(options) {
        console.log('requestPermissions not implemented for web:' + JSON.stringify(options));
        throw this.unimplemented('requestPermissions not implemented for web');
    }
    async getDeviceDiscoveryEventName(options) {
        console.log('getDeviceDiscoveryEventName not implemented for web:' + JSON.stringify(options));
        throw this.unimplemented('getDeviceDiscoveryEventName not implemented for web');
    }
    async getDeviceResponseEventName(options) {
        console.log('getDeviceResponseEventName not implemented for web:' + JSON.stringify(options));
        throw this.unimplemented('getDeviceResponseEventName not implemented for web');
    }
    async getBluetoothAdapterState(options) {
        console.log('getBluetoothAdapterState not implemented for web:' + JSON.stringify(options));
        throw this.unimplemented('getBluetoothAdapterState not implemented for web');
    }
    async setBluetoothAdapterState(options) {
        console.log('setBluetoothAdapterState not implemented for web: ' + JSON.stringify(options));
        throw this.unimplemented('setBluetoothAdapterState not implemented for web');
    }
    async getBuildVersion(options) {
        console.log('getBuildVersion not implemented for web: ' + JSON.stringify(options));
        throw this.unimplemented('getBuildVersion not implemented for web');
    }
    async startChaSearch(options) {
        console.log('startChaSearch not implemented for web: ' + JSON.stringify(options));
        throw this.unimplemented('startChaSearch not implemented for web');
    }
    async cancelChaSearch(options) {
        console.log('cancelChaSearch not implemented for web: ' + JSON.stringify(options));
        throw this.unimplemented('cancelChaSearch not implemented for web');
    }
    async connect(options) {
        console.log('connect not implemented for web: ' + JSON.stringify(options));
        throw this.unimplemented('connect not implemented for web');
    }
    async disconnect(options) {
        console.log('disconnect not implemented for web: ' + JSON.stringify(options));
        throw this.unimplemented('disconnect not implemented for web');
    }
    async requestAssociatedA2DP(options) {
        console.log('requestAssociatedA2DP not implemented for web: ' + JSON.stringify(options));
        throw this.unimplemented('requestAssociatedA2DP not implemented for web');
    }
    async startListener(options) {
        console.log('startListener not implemented for web: ' + JSON.stringify(options));
        throw this.unimplemented('startListener not implemented for web');
    }
    async stopListener(options) {
        console.log('stopListener not implemented for web: ' + JSON.stringify(options));
        throw this.unimplemented('stopListener not implemented for web');
    }
    async requestCalibrationList(options) {
        console.log('requestCalibrationList not implemented for web: ' + JSON.stringify(options));
        throw this.unimplemented('requestCalibrationList not implemented for web');
    }
    async requestCalibrationEntry(options) {
        console.log('requestCalibrationEntry not implemented for web: ' + JSON.stringify(options));
        throw this.unimplemented('requestCalibrationEntry not implemented for web');
    }
    async startCalibrationWrite(options) {
        console.log('startCalibrationWrite not implemented for web: ' + JSON.stringify(options));
        throw this.unimplemented('startCalibrationWrite not implemented for web');
    }
    async requestId(options) {
        console.log('requestId not implemented for web: ' + JSON.stringify(options));
        throw this.unimplemented('requestId not implemented for web');
    }
    async requestProbeId(options) {
        console.log('requestProbeId not implemented for web: ' + JSON.stringify(options));
        throw this.unimplemented('requestProbeId not implemented for web');
    }
    async requestStatus(options) {
        console.log('requestStatus not implemented for web: ' + JSON.stringify(options));
        throw this.unimplemented('requestStatus not implemented for web');
    }
    async queueExam(options) {
        console.log('queueExam not implemented for web: ' + JSON.stringify(options));
        throw this.unimplemented('queueExam not implemented for web');
    }
    async examSubmission(options) {
        console.log('examSubmission not implemented for web: ' + JSON.stringify(options));
        throw this.unimplemented('examSubmission not implemented for web');
    }
    async setSoftwareButtonState(options) {
        console.log('setSoftwareButtonState not implemented for web: ' + JSON.stringify(options));
        throw this.unimplemented('setSoftwareButtonState not implemented for web');
    }
    async abortExams(options) {
        console.log('abortExams not implemented for web: ' + JSON.stringify(options));
        throw this.unimplemented('abortExams not implemented for web');
    }
    async requestResults(options) {
        console.log('requestResults not implemented for web: ' + JSON.stringify(options));
        throw this.unimplemented('requestResults not implemented for web');
    }
    async requestSdBytesFree(options) {
        console.log('requestSdBytesFree not implemented for web: ' + JSON.stringify(options));
        throw this.unimplemented('requestSdBytesFree not implemented for web');
    }
    async reprogram(options) {
        console.log('reprogram not implemented for web: ' + JSON.stringify(options));
        throw this.unimplemented('reprogram not implemented for web');
    }
    async reboot(options) {
        console.log('reboot not implemented for web: ' + JSON.stringify(options));
        throw this.unimplemented('reboot not implemented for web');
    }
    async shutdown(options) {
        console.log('shutdown not implemented for web: ' + JSON.stringify(options));
        throw this.unimplemented('shutdown not implemented for web');
    }
    async deleteFile(options) {
        console.log('deleteFile not implemented for web: ' + JSON.stringify(options));
        throw this.unimplemented('deleteFile not implemented for web');
    }
    async startFileWrite(options) {
        console.log('startFileWrite not implemented for web: ' + JSON.stringify(options));
        throw this.unimplemented('startFileWrite not implemented for web');
    }
    async startFileRead(options) {
        console.log('startFileRead not implemented for web: ' + JSON.stringify(options));
        throw this.unimplemented('startFileRead not implemented for web');
    }
    async requestDirectory(options) {
        console.log('requestDirectory not implemented for web: ' + JSON.stringify(options));
        throw this.unimplemented('requestDirectory not implemented for web');
    }
    async getLfnFromSfn(options) {
        console.log('getLfnFromSfn not implemented for web: ' + JSON.stringify(options));
        throw this.unimplemented('getLfnFromSfn not implemented for web');
    }
    async makeDirectory(options) {
        console.log('makeDirectory not implemented for web: ' + JSON.stringify(options));
        throw this.unimplemented('makeDirectory not implemented for web');
    }
    async cancelFileOperation(options) {
        console.log('cancelFileOperation not implemented for web: ' + JSON.stringify(options));
        throw this.unimplemented('cancelFileOperation not implemented for web');
    }
    async format(options) {
        console.log('format not implemented for web: ' + JSON.stringify(options));
        throw this.unimplemented('format not implemented for web');
    }
    async a2dpIsPaired(options) {
        console.log('a2dpIsPaired not implemented for web: ' + JSON.stringify(options));
        throw this.unimplemented('a2dpIsPaired not implemented for web');
    }
    async a2dpIsConnected(options) {
        console.log('a2dpIsConnected not implemented for web: ' + JSON.stringify(options));
        throw this.unimplemented('a2dpIsConnected not implemented for web');
    }
    async a2dpBeginPairing(options) {
        console.log('a2dpBeginPairing not implemented for web: ' + JSON.stringify(options));
        throw this.unimplemented('a2dpBeginPairing not implemented for web');
    }
    async a2dpUnpair(options) {
        console.log('a2dpUnpair not implemented for web: ' + JSON.stringify(options));
        throw this.unimplemented('a2dpUnpair not implemented for web');
    }
    async a2dpBeginConnection(options) {
        console.log('a2dpBeginConnection not implemented for web: ' + JSON.stringify(options));
        throw this.unimplemented('a2dpBeginConnection not implemented for web');
    }
    async a2dpDisconnect(options) {
        console.log('a2dpDisconnect not implemented for web: ' + JSON.stringify(options));
        throw this.unimplemented('a2dpDisconnect not implemented for web');
    }
    async noiseFeatureStart(options) {
        console.log('noiseFeatureStart not implemented for web: ' + JSON.stringify(options));
        throw this.unimplemented('noiseFeatureStart not implemented for web');
    }
    async noiseFeaturePause(options) {
        console.log('noiseFeaturePause not implemented for web: ' + JSON.stringify(options));
        throw this.unimplemented('noiseFeaturePause not implemented for web');
    }
    async noiseFeatureResume(options) {
        console.log('noiseFeatureResume not implemented for web: ' + JSON.stringify(options));
        throw this.unimplemented('noiseFeatureResume not implemented for web');
    }
    async noiseFeatureStop(options) {
        console.log('noiseFeatureStop not implemented for web: ' + JSON.stringify(options));
        throw this.unimplemented('noiseFeatureStop not implemented for web');
    }
    async noiseFeatureChangeLevel(options) {
        console.log('noiseFeatureChangeLevel not implemented for web: ' + JSON.stringify(options));
        throw this.unimplemented('noiseFeatureChangeLevel not implemented for web');
    }
    async requestSetting(options) {
        console.log('requestSetting not implemented for web: ' + JSON.stringify(options));
        throw this.unimplemented('requestSetting not implemented for web');
    }
    async writeSetting(options) {
        console.log('writeSetting not implemented for web: ' + JSON.stringify(options));
        throw this.unimplemented('writeSetting not implemented for web');
    }
    async requestExamId(options) {
        console.log('requestExamId not implemented for web: ' + JSON.stringify(options));
        throw this.unimplemented('requestExamId not implemented for web');
    }
}
//# sourceMappingURL=web.js.map