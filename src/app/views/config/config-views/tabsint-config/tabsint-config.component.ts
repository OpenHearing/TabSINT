import { Component, ChangeDetectorRef, OnInit, OnDestroy, ViewChild, ElementRef, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { TranslocoService } from '@jsverse/transloco';
import { Subscription } from 'rxjs';

import { DiskInterface } from '../../../../models/disk/disk.interface';
import { StateInterface } from '../../../../models/state/state.interface';
import { VersionInterface } from '../../../../models/version/version.interface';

import { DiskModel } from '../../../../models/disk/disk.service';
import { Logger } from '../../../../services/logger.service';
import { VersionModel } from '../../../../models/version/version.service';
import { StateModel } from '../../../../models/state/state.service';

import { AppState, DialogType, Headset } from '../../../../utilities/constants';
import { ChangePinComponent } from '../../../change-pin/change-pin.component';
import { ChangeMaxLogLengthComponent } from '../../../change-max-log-length/change-max-log-length.component';
import { QrService } from '../../../../services/qr.service';
import { FileService } from '../../../../services/file.service';
import { TabsintFs } from 'tabsintfs';
import { Notifications } from '../../../../services/notifications.service';
import { AudioService } from '../../../../services/audio.service';
import { DialogDataInterface } from '../../../../interfaces/dialog-data.interface';

@Component({
  selector: 'app-tabsint-config-view',
  templateUrl: './tabsint-config.component.html',
  styleUrl: './tabsint-config.component.css',
})
export class TabsintConfigComponent implements OnInit, OnDestroy {
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly diskModel = inject(DiskModel);
  private readonly logger = inject(Logger);
  private readonly dialog = inject(MatDialog);
  private readonly stateModel = inject(StateModel);
  private readonly transloco = inject(TranslocoService);
  private readonly versionModel = inject(VersionModel);
  private readonly qrService = inject(QrService);
  private readonly fileService = inject(FileService);
  private readonly notifications = inject(Notifications);
  private readonly audioService = inject(AudioService);

  disk: DiskInterface;
  state: StateInterface;
  version!: VersionInterface;
  headsets = Object.values(Headset);
  qrPreferencesString?: string = undefined;
  displayPreferencesQrCode: boolean = false;

  @ViewChild('qrCanvas', { read: ElementRef })
  qrCanvas!: ElementRef;

  diskSubscription: Subscription | undefined;
  stateSubscription: Subscription | undefined;

  constructor() {
    this.state = this.stateModel.getState();
    this.disk = this.diskModel.getDisk();
  }

  ngOnInit(): void {
    this.asyncNgOnInit();
    this.diskSubscription = this.diskModel.diskSubject.subscribe((updatedDisk: DiskInterface) => {
      this.disk = updatedDisk;
      this.qrPreferencesString = JSON.stringify(this.disk.preferences);
    });
    this.stateSubscription = this.stateModel.stateSubject.subscribe(updatedState => {
      this.state = updatedState;
    });
    this.stateModel.updateState({ appState: AppState.Admin });
  }

  ngOnDestroy(): void {
    this.diskSubscription?.unsubscribe();
    this.stateSubscription?.unsubscribe();
  }

  /**
   * Function to be called by ngOnIit to handle any asynchronous operations.
   */
  private async asyncNgOnInit(): Promise<void> {
    this.version = await this.versionModel.getVersion();
  }

  readonly languages: { code: string; label: string }[] = [
    { code: 'en', label: 'English' },
    { code: 'fr', label: 'French' },
    { code: 'ja', label: 'Japanese' },
    { code: 'es', label: 'Spanish' },
    { code: 'sw', label: 'Swahili' },
  ];

  // Functions

  /**
   * Change the default headset for the application.
   * @param headset The new headset enumeration value to be stored.
   */
  changeHeadset(headset: Headset) {
    this.diskModel.updatePreferences({ headset: headset });
    this.logger.debug('Headset changed to: ' + headset);
  }

  get currentLanguageLabel() {
    return this.languages.find(l => l.code === this.disk.preferences.language)?.label ?? 'English';
  }

  changeLanguage(code: string) {
    this.diskModel.updatePreferences({ language: code });
    this.transloco.setActiveLang(code);
    this.logger.debug('Language changed to: ' + code);
  }

  // changeResultsMode(resultsMode: ResultsMode) {
  //   this.diskModel.updatePreferences({resultsMode: resultsMode});
  //   this.logger.debug("ResultsMode changed to: "+JSON.stringify(resultsMode));
  // }

  editAdminPin() {
    this.dialog.open(ChangePinComponent);
  }

  editMaxLogRows() {
    this.dialog.open(ChangeMaxLogLengthComponent);
  }

  toggleAutoUpload() {
    this.diskModel.updatePreferences({ autoUpload: this.disk.preferences.autoUpload == undefined || !this.disk.preferences.autoUpload });
  }

  toggleDebugMode() {
    this.diskModel.updatePreferences({ debugMode: !this.disk.preferences.debugMode });
  }

  toggleShowTympanPanel() {
    this.diskModel.updatePreferences({ showTympanPanel: !(this.disk.preferences.showTympanPanel ?? true) });
  }

  toggleShowWahtsPanel() {
    this.diskModel.updatePreferences({ showWahtsPanel: !(this.disk.preferences.showWahtsPanel ?? true) });
  }

  toggleShowDuodosePanel() {
    this.diskModel.updatePreferences({ showDuodosePanel: !(this.disk.preferences.showDuodosePanel ?? true) });
  }

  toggleDisableLogs() {
    this.diskModel.updatePreferences({ disableLogs: !this.disk.preferences.disableLogs });
  }

  /**
   * Toggle the setting for automatic system volume control.
   * Show an alert only for disabling automatic volume control.
   */
  toggleDisableVolume() {
    if (!this.disk.preferences.disableVolume) {
      const msg: DialogDataInterface = {
        title: 'Disable Automatic Volume Control',
        content: `
            Are you sure you want to disable Automatic Volume Control within TabSINT?
            This feature is essential to providing calibrated audio during tests.
            `,
        type: DialogType.Confirm,
      };
      this.notifications.alert(msg).subscribe(async result => {
        if (result === 'OK') {
          this.diskModel.updatePreferences({ disableVolume: !this.disk.preferences.disableVolume });
          this.logger.debug('Automatic Volume control is now disabled.');
        }
      });
    } else {
      this.diskModel.updatePreferences({ disableVolume: !this.disk.preferences.disableVolume });
    }
  }

  /**
   * Update the tablet gain preference.
   * @param gain The new tablet gain value.
   */
  updateTabletGain(gain: number | string) {
    const gainNumber = Number(gain);
    if (isNaN(gainNumber)) {
      this.logger.debug('Invalid user tablet gain value entered.');
    } else {
      this.diskModel.updatePreferences({ tabletGain: gainNumber });
    }
  }

  /**
   * Negate the current user defined tablet gain if available.
   */
  negateTabletGain() {
    const currentUserGain = this.disk.preferences.tabletGain;
    if (currentUserGain !== undefined) {
      this.diskModel.updatePreferences({ tabletGain: -currentUserGain });
    } else {
      this.logger.debug('Cannot negate undefined user tablet gain.');
    }
  }

  /**
   * Reset the tablet gain value to be undefined.
   */
  resetTabletGain() {
    this.diskModel.updatePreferences({ tabletGain: undefined });
  }

  /**
   * Reset the preferences to the default values.
   */
  resetConfig() {
    this.diskModel.resetPreferences();
  }

  /**
   * Save the preference QR code to the device and display the QR Code.
   */
  async generatePreferencesQrCode() {
    const outputDirectory = 'tabsint-configuration';
    const date = new Date().toISOString().replace(':', '_').replace(':', '-').split('.')[0];
    const filename = `${date}-qrcode.png`;

    const qrPreferencesUrl = this.qrCanvas.nativeElement.querySelector('canvas').toDataURL('image/png');
    const dataBlob = this.qrService.urlToBlob(qrPreferencesUrl);
    let fileResponse = undefined;

    if (dataBlob) {
      fileResponse = await this.fileService.writeBinaryFile(`${outputDirectory}/${filename}`, dataBlob);
    }
    if (fileResponse) {
      this.displayPreferencesQrCode = true;
      this.notifications.alert({
        title: 'QR Code',
        content: `Current TabSINT configuration saved as QR Code on your tablet: ${outputDirectory}/${filename}`,
        type: DialogType.Alert,
      });
    } else {
      this.displayPreferencesQrCode = false;
      this.notifications.alert({
        title: 'QR Code',
        content: 'Failed to save the QR code.',
        type: DialogType.Alert,
      });
      this.logger.error('Saving QR Code failed.');
    }
  }

  async changeLocalResultsDir() {
    try {
      const result = await TabsintFs.chooseFolder();
      const servers = this.disk.preferences.servers;
      servers.localServer.resultsDir = result.name;
      servers.localServer.resultsDirUri = result.uri;
      this.diskModel.updatePreferences({ servers: servers });
    } catch (error) {
      this.logger.debug('Error choosing folder:' + error);
    }

    this.cdr.detectChanges();
  }

  /**
   * Play the 1KHz 94dB wav file from the admin panel.
   */
  async play1kHz94dB() {
    await this.audioService.play1kHz94dB();
  }

  /**
   * Play the comp audio wav file from the admin panel.
   */
  async playCompAudio() {
    await this.audioService.playCompAudio();
  }

  /**
   * Play the comp audio linear wav file from the admin panel.
   */
  async playCompAudioLinear() {
    await this.audioService.playCompAudioLinear();
  }

  // Popovers

  get headsetPopover() {
    return this.transloco.translate(
      'Select the default headset used to administer hearing tests. ' +
        'This selection is overridden by the <code>headset</code> parameter in protocols. <br /><br /> If the protocol does not specify a <code>headset</code>, ' +
        "this value must match the value in the protocol's <code>calibration.json</code> file."
    );
  }

  get languagePopover() {
    return this.transloco.translate(
      'Select preferred language for the application. This language will be used where supported. Otherwise, English will be used. Note this cannot change any text configured in protocols.'
    );
  }

  get adminPopover() {
    return this.transloco.translate(
      'Includes additional configuration options, displays expandable <b>debug</b> menus showing program state at the bottom of exam pages, and suppresses Admin Password prompts.'
    );
  }

  get adminPinPopover() {
    return this.transloco.translate(
      'Change the Admin PIN to any numerical value.  This PIN is required to switch to Admin View and to reset exams when Admin Mode is off.'
    );
  }

  get disableLogsPopover() {
    return this.transloco.translate(
      'Disable log messages from being stored and uploaded. <br /><br />Logs are useful for investigating software bugs, but may introduce privacy concerns. Disable logging anytime sensitive data is being collected.'
    );
  }

  get setMaxLogRowsPopover() {
    return this.transloco.translate('Set the maximum number of log records to be saved. This will prevent the logs from consuming too much memory.');
  }

  get qrCodePopover() {
    return this.transloco.translate(
      'Generate a QR Code containing all the current configuration settings. Select the local directory to save the QR Code for future use.'
    );
  }

  get resetConfigurationPopover() {
    return this.transloco.translate('Reset TabSINT configuration to the default configuration. All manual changes will be removed.');
  }

  get automaticallyOutputResultsPopover() {
    return this.transloco.translate(
      'Automatically upload or export the result when a test is finished. The result will be uploaded or exported on the <b>Exam Complete</b> page. <br /><br /> Once the result is uploaded to a server or exported to a local file, it will be removed from TabSINT.'
    );
  }

  get disableVolumePopover() {
    return this.transloco.translate(
      'This option will disable TabSINT from setting the volume to 100% on every page. This feature is essential to the functionality of TabSINT while playing calibrated audio through the speaker.<br /><br />' +
        'Check this box if you would like to set the volume of the app manually using the buttons on the side of the device. <br /><br />In almost all cases, this box should remain unchecked.'
    );
  }

  get gainPopover() {
    return this.transloco.translate(
      'Apply a special gain in dB to the audio level output through TabSINT. ' +
        'This can be used to calibrate the audio jack output to a specified level for all audio played through the tablet.'
    );
  }
}
