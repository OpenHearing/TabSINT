import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

import { DiskModel } from '../../models/disk/disk.service';
import { Logger } from '../../utilities/logger.service';
import { FileService } from '../../controllers/file.service';
import { AdminService } from '../../controllers/admin.service';
import { VersionService } from '../../controllers/version.service';
import { ConfigService } from '../../controllers/config.service';
import { AppState } from '../../utilities/constants';
import { StateModel } from '../../models/state/state.service';
import { DiskInterface } from '../../models/disk/disk.interface';
import { StateInterface } from '../../models/state/state.interface';
import { ResultsMode } from '../../utilities/constants';
import { ChangePinComponent } from '../change-pin/change-pin.component';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'tabsint-config-view',
  templateUrl: './tabsint-config.component.html',
  styleUrl: './tabsint-config.component.css'
})
export class TabsintConfigComponent {
  disk: DiskInterface;
  state: StateInterface;
  version: any;

  constructor(
    public diskModel: DiskModel, 
    public fileService: FileService,
    public adminService: AdminService,
    public configService: ConfigService,
    public versionService: VersionService,
    public logger: Logger, 
    public stateModel: StateModel,
    public translate: TranslateService,
    public dialog: MatDialog
  ) { 
    this.disk = this.diskModel.getDisk();
    this.version = this.versionService.getVersion();
    this.state = this.stateModel.getState();
  }

  ngOnInit(): void {
    this.stateModel.setAppState(AppState.Admin);
  }

  // VARIABLES - PROBABLY SHOULD BE MOVED?

  headsets: Array<string> = [
    "None",
    "HDA200",
    "VicFirth",
    "VicFirthS2",
    "WAHTS",
    "EPHD1",
    "Audiometer"
  ];

  languages: Array<string> = [
    this.translate.instant("English"),
    this.translate.instant("Japanese"),
    this.translate.instant("French"),
    this.translate.instant("Spanish"),
  ];

  resultsModeOptions = ResultsMode;


  // Functions

  changeHeadset(headset: string) {
    this.disk.headset = headset;
    this.logger.debug("Headset changed to: "+headset);
  }

  changeLanguage(language: string) {
    this.disk.language = language;
    // need to update the language here
    this.translate.setDefaultLang(language);
    this.logger.debug("Language changed to: "+language);
  }

  changeResultsMode(resultsMode: ResultsMode) {
    this.disk.resultsMode = resultsMode;
    this.logger.debug("ResultsMode changed to: "+JSON.stringify(resultsMode));
  }

  editAdminPin() {
    this.dialog.open(ChangePinComponent).afterClosed().subscribe();
  }

  editMaxLogRows() {
    console.log("editMaxLogRows pressed");
  }

  resetConfig() {
    console.log("resetConfig pressed");
  }

  toggleAutoUpload() {
    console.log("toggleAutoUpload pressed");
  }

  gainReset() {
    console.log("gainReset pressed");
  }

  play1kHz94dB() {
    console.log("play1kHz94dB pressed");
  }

  playCompAudio() {
    console.log("playCompAudio pressed");
  }

  playCompAudioLinear() {
    console.log("playCompAudioLinear pressed");
  }

  // Popovers

  headsetPopover = this.translate.instant(
    "Select the deafult headset used to adminster hearing tests. " +
    "This selection is overridden by the <code>headset</code> parameter in protocols. <br /><br /> If the protocol does not specify a <code>headset</code>, " +
    "this value must match the value in the protocol's <code>calibration.json</code> file."
  );

  languagePopover = this.translate.instant(
    "Select preferred language for the application. This language will be used where supported. Otherwise, English will be used. Note this cannot change any text configured in protocols."
  );

  adminPopover = this.translate.instant(
    "Includes additional configuration options, displays expandable <b>debug</b> menus showing program state at the bottom of exam pages, and suppresses Admin Password prompts"
  );

  adminPinPopover = this.translate.instant(
    "Change the Admin PIN to any numerical value.  This PIN is required to switch to Admin View and to reset exams when Admin Mode is off."
  );

  disableLogsPopover = this.translate.instant(
    "Disable log messages from being stored and uploaded. <br /><br />Logs are useful for investigating software bugs, but may introduce privacy concerns. Disable logging anytime sensitive data is being collected."
  );

  setMaxLogRowsPopover = this.translate.instant(
    "Set the maximum number of log records to be saved. This will prevent the logs from consuming too much memory."
  );

  disableVolumePopover = this.translate.instant(
    "This option will disable TabSINT from setting the volume to 100% on every page. This feature is essential to the functionality of TabSINT while playing calibrated audio through the speaker.<br /><br />" +
    "Check this box if you would like to set the volume of the app manually using the buttons on the side of the device. <br /><br />In almost all cases, this box should remain unchecked."
  );

  adminSkipModePopover = this.translate.instant(
    "This option will enable skipping on every page of an Exam. This feature is should only be enabled while developing or debugging, and may cause issues with some protocols."
  );

  requireEncryptedResultsPopover = this.translate.instant(
    "This option requires that the protocol contains a public RSA key for encrypting output results."
  );

  recordTestLocationPopover = this.translate.instant(
    "This option will record the test location (latitude, longitude) in the results. The test location is only recorded when the test first starts." +
    "<br /><br />TabSINT will request permission to access the device location when this option is enabled. The device's location services must be turned for the location to be successfully stored."
  );

  qrCodePopover = this.translate.instant(
    "Generate a QR Code containing all the current configuration settings. Select the local directory to save the QR Code for future use."
  );

  resetConfigurationPopover = this.translate.instant(
    "Reset TabSINT configuration to the default configuration. All manual changes will be removed."
  );

  automaticallyOutputResultsPopover = this.translate.instant(
    "Automatically upload or export the result when a test is finished. The result will be uploaded or exported on the <b>Exam Complete</b> page. <br /><br /> Once the result is uploaded to a server or exported to a local file, it will be removed from TabSINT."
  );

  gainPopover = this.translate.instant(
    "Apply a special gain in dB to the audio level output through TabSINT. " +
    "This can be used to calibrate the audio jack output to a specified level for all audio played through the tablet."
  );

}
