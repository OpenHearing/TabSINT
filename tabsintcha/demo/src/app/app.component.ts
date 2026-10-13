import { Component, OnDestroy, OnInit } from '@angular/core';

import { DiscoveryResponse, DeviceResponse, TabsintCha } from 'tabsintcha';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'demo';
  level = 0;
  buttonState = 0;
  chaName = '';
  myA2dp = '';

  ngOnInit(): void {
    // Setup the listeners for the different TabsintCha events and preserve 'this' context with arrow functions
    TabsintCha.addListener('TabsintChaDiscovery', response => this.discoveryEventListener(response));
    TabsintCha.addListener('TabsintChaDevice', response => this.deviceEventListener(response));
  }

  ngOnDestroy(): void {
    // Tear down all TabsintCha event listeners
    TabsintCha.removeAllListeners();
  }

  private async handlePromise(promise: Promise<unknown>): Promise<void> {
    try {
      const response = await promise;
      alert('Success!  ' + JSON.stringify(response));
    } catch (error) {
      alert('Failure!  ' + error);
    }
  }

  checkPermissions() {
    this.handlePromise(TabsintCha.checkPermissions({}));
  }

  requestPermissions() {
    this.handlePromise(TabsintCha.requestPermissions({}));
  }

  getBluetoothState() {
    this.handlePromise(TabsintCha.getBluetoothAdapterState({}));
  }

  enableBluetooth() {
    this.handlePromise(TabsintCha.setBluetoothAdapterState({ newState: 'on' }));
  }

  discovery(infStr: string) {
    alert('Starting discovery...');
    this.chaName = '';
    this.handlePromise(TabsintCha.startChaSearch({ infStr: infStr }));
  }

  cancelDiscovery() {
    alert('Cancelling discovery...');
    this.handlePromise(TabsintCha.cancelChaSearch({}));
  }

  async connect() {
    await this.handlePromise(TabsintCha.connect({ name: this.chaName }));
    this.handlePromise(TabsintCha.startListener({ name: this.chaName }));
  }

  async disconnect() {
    await this.handlePromise(TabsintCha.disconnect({ name: this.chaName }));
    this.handlePromise(TabsintCha.stopListener({ name: this.chaName }));
  }

  deviceEventListener(response: DeviceResponse) {
    try {
      alert(response.res[0] + ': ' + JSON.stringify(response.res[1]));
      if (response.res[0] == 'AssociatedA2dpDiscovered') {
        this.myA2dp = response.res[1] as string;
      }
    } catch (e) {
      alert('Error in event listener: ' + e);
    }
  }

  discoveryEventListener(response: DiscoveryResponse) {
    this.chaName = response.name;
    alert('Got a CHA: ' + this.chaName);
  }

  requestId() {
    this.handlePromise(TabsintCha.requestId({ name: this.chaName }));
  }

  requestProbeId() {
    this.handlePromise(TabsintCha.requestProbeId({ name: this.chaName }));
  }

  requestStatus() {
    this.handlePromise(TabsintCha.requestStatus({ name: this.chaName }));
  }

  queueBekesy() {
    const args = { F: 1500, UseSoftwareButton: true, FDevForm: 'Sine', BypassCalibrationLimit: true };
    this.handlePromise(TabsintCha.queueExam({ name: this.chaName, examName: 'BekesyLike', params: args }));
  }

  queueHw() {
    const args = { F: 1500, UseSoftwareButton: true, FDevForm: 'Sine' };
    this.handlePromise(TabsintCha.queueExam({ name: this.chaName, examName: 'HughsonWestlake', params: args }));
  }

  queueBekesyFrequency() {
    const args = { Fstart: 1000, Level: 55, UseSoftwareButton: true, FDevForm: 'Sine', BypassCalibrationLimit: true };
    this.handlePromise(TabsintCha.queueExam({ name: this.chaName, examName: 'BekesyFrequency', params: args }));
  }

  requestResults() {
    this.handlePromise(TabsintCha.requestResults({ name: this.chaName }));
  }

  abortExams() {
    this.handlePromise(TabsintCha.abortExams({ name: this.chaName }));
  }

  toggleSoftwareButton() {
    this.buttonState = this.buttonState ^ 1;
    this.handlePromise(TabsintCha.setSoftwareButtonState({ name: this.chaName, state: this.buttonState }));
  }

  startFileWrite() {
    this.handlePromise(TabsintCha.startFileWrite({ name: this.chaName, localFile: 'some_local_file', remoteFile: 'HTML_TST.DAT', flags: undefined }));
  }

  reprogram() {
    this.handlePromise(TabsintCha.reprogram({ name: this.chaName, crc32: 0 }));
  }

  reboot() {
    this.handlePromise(TabsintCha.reboot({ name: this.chaName }));
  }

  getA2dp() {
    this.handlePromise(TabsintCha.requestAssociatedA2DP({ name: this.chaName }));
  }
  connectA2dp() {
    this.handlePromise(TabsintCha.a2dpBeginConnection({ name: this.myA2dp }));
  }

  disconnectA2dp() {
    this.handlePromise(TabsintCha.a2dpDisconnect({ name: this.myA2dp }));
  }

  noiseFeatureStart() {
    this.level = 50;
    const level_spl = [this.level, this.level];
    const args = {
      Level: level_spl,
      Type: 'white',
    };
    this.handlePromise(TabsintCha.noiseFeatureStart({ name: this.chaName, params: args }));
  }

  noiseFeaturePause() {
    this.handlePromise(TabsintCha.noiseFeaturePause({ name: this.chaName }));
  }

  noiseFeatureResume() {
    this.handlePromise(TabsintCha.noiseFeatureResume({ name: this.chaName }));
  }

  noiseFeatureStop() {
    this.handlePromise(TabsintCha.noiseFeatureStop({ name: this.chaName }));
  }

  noiseFeatureIncreaseLevel() {
    this.level += 5;
    const level_spl = [this.level, this.level];
    this.handlePromise(TabsintCha.noiseFeatureChangeLevel({ name: this.chaName, levels: level_spl }));
  }

  noiseFeatureDecreaseLevel() {
    this.level -= 5;
    const level_spl = [this.level, this.level];
    this.handlePromise(TabsintCha.noiseFeatureChangeLevel({ name: this.chaName, levels: level_spl }));
  }
}
