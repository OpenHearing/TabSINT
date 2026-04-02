import { Component, ChangeDetectorRef, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
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

@Component({
  selector: 'tabsint-config-view',
  templateUrl: './tabsint-config.component.html',
  styleUrl: './tabsint-config.component.css',
})
export class TabsintConfigComponent implements OnInit, OnDestroy {
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

  constructor(
    private readonly cdr: ChangeDetectorRef,
    private readonly diskModel: DiskModel,
    private readonly logger: Logger,
    private readonly dialog: MatDialog,
    private readonly stateModel: StateModel,
    private readonly transloco: TranslocoService,
    private readonly versionModel: VersionModel,
    private readonly qrService: QrService,
    private readonly fileService: FileService,
    private readonly notifications: Notifications
  ) {
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

  toggleDisableLogs() {
    this.diskModel.updatePreferences({ disableLogs: !this.disk.preferences.disableLogs });
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
    return this.transloco.translate(
      'Set the maximum number of log records to be saved. This will prevent the logs from consuming too much memory.'
    );
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
}
