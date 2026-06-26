import { Component, ChangeDetectorRef, OnInit, OnDestroy, ViewChild, ElementRef, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { TranslocoService } from '@jsverse/transloco';
import { firstValueFrom, Subscription } from 'rxjs';

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
  headset = Headset.None;
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
    this.headset = headset;
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

  toggleShowSvantekPanel() {
    this.diskModel.updatePreferences({ showSvantekPanel: !(this.disk.preferences.showSvantekPanel ?? true) });
  }

  toggleDisableLogs() {
    this.diskModel.updatePreferences({ disableLogs: !this.disk.preferences.disableLogs });
  }

  /**
   * Toggle the setting for automatic system volume control.
   * Show an alert only for disabling automatic volume control.
   * @param event The click event.
   */
  async toggleDisableVolume(event: Event) {
    const checkbox = event.target as HTMLInputElement;
    if (!this.disk.preferences.disableVolume) {
      const msg: DialogDataInterface = {
        title: 'Disable Automatic Volume Control',
        content: `
            Are you sure you want to disable Automatic Volume Control within TabSINT?
            This feature is essential to providing calibrated audio during tests.
            `,
        type: DialogType.Confirm,
      };
      const result = await firstValueFrom(this.notifications.alert(msg));
      if (result === 'OK') {
        this.diskModel.updatePreferences({ disableVolume: !this.disk.preferences.disableVolume });
        this.logger.debug('Automatic Volume control is now disabled.');
      } else {
        // Reset checkbox checked state for since we are aren't changing the value
        checkbox.checked = this.disk.preferences.disableVolume;
      }
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
    await this.audioService.play1kHz94dB(this.headset);
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
    return this.transloco.translate('Select Headset Popover');
  }

  get languagePopover() {
    return this.transloco.translate('Select Language Help');
  }

  get adminPopover() {
    return this.transloco.translate('Admin Mode Popover');
  }

  get adminPinPopover() {
    return this.transloco.translate('Admin PIN Popover');
  }

  get disableLogsPopover() {
    return this.transloco.translate('Disable Logs Popover');
  }

  get setMaxLogRowsPopover() {
    return this.transloco.translate('Set the maximum number of log records to be saved. This will prevent the logs from consuming too much memory.');
  }

  get qrCodePopover() {
    return this.transloco.translate('QR Code Help');
  }

  get resetConfigurationPopover() {
    return this.transloco.translate('Reset TabSINT configuration to the default configuration. All manual changes will be removed.');
  }

  get automaticallyOutputResultsPopover() {
    return this.transloco.translate('Automatically Output Test Results Popover');
  }

  get disableVolumePopover() {
    return this.transloco.translate('Automatic Volume Control Popover');
  }

  get gainPopover() {
    return this.transloco.translate('Tablet Gain Popover');
  }
}
