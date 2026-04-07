import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { TranslocoService } from '@jsverse/transloco';
import _ from 'lodash';
import { Subscription, firstValueFrom } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';

import { TabsintFs } from 'tabsintfs';

import { DiskInterface } from './models/disk/disk.interface';
import { AppInterface } from './models/app/app.interface';
import { ProtocolModelInterface } from './models/protocol/protocol.interface';

import { DiskModel } from './models/disk/disk.service';
import { AppModel } from './models/app/app.service';
import { ProtocolService } from './controllers/protocol.service';
import { ProtocolModel } from './models/protocol/protocol-model.service';
import { SqLite } from './services/sqLite.service';
import { Logger } from './services/logger.service';
import { FileService } from './services/file.service';
import { DisclaimerComponent } from './views/disclaimer/disclaimer.component';
import { StateModel } from './models/state/state.service';
import { NetworkService } from './controllers/network.service';
import { Notifications } from './services/notifications.service';
import { DialogType } from './utilities/constants';
import { DevicesService } from './services/devices/devices.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
})
export class AppComponent implements OnInit, OnDestroy {
  private readonly appModel = inject(AppModel);
  private readonly devicesService = inject(DevicesService);
  private readonly diskModel = inject(DiskModel);
  private readonly fileService = inject(FileService);
  private readonly logger = inject(Logger);
  private readonly protocolM = inject(ProtocolModel);
  private readonly protocolService = inject(ProtocolService);
  private readonly router = inject(Router);
  private readonly sqLite = inject(SqLite);
  private readonly transloco = inject(TranslocoService);
  private readonly dialog = inject(MatDialog);
  private readonly stateModel = inject(StateModel);
  private readonly networkService = inject(NetworkService);
  private readonly notifications = inject(Notifications);

  title = 'tabsint';
  app: AppInterface;
  disk: DiskInterface;
  diskSubscription: Subscription | undefined;
  protocol: ProtocolModelInterface;

  constructor() {
    const savedLang = this.diskModel.getDisk().preferences.language ?? 'en';
    this.transloco.setActiveLang(savedLang);
    this.app = this.appModel.getApp();
    this.protocol = this.protocolM.getProtocolModel();
    this.disk = this.diskModel.getDisk();
    this.diskModel.updateDiskModel({ numLogRows: 1 });
  }

  ngOnInit(): void {
    this.asyncNgOnInit();
    this.diskSubscription = this.diskModel.diskSubject.subscribe((updatedDisk: DiskInterface) => {
      this.disk = updatedDisk;
    });
  }

  ngOnDestroy(): void {
    this.diskSubscription?.unsubscribe();
  }

  /**
   * Function to be called by ngOnIit to handle any asynchronous operations.
   */
  private async asyncNgOnInit(): Promise<void> {
    await this.sqLite.init();
    this.router.navigate(['']);

    if (!this.disk.contentURI) {
      await firstValueFrom(
        this.notifications.alert({
          title: 'Select Documents Folder',
          content: `Please use the Android File Chooser to select the documents folder.`,
          type: DialogType.Alert,
        })
      );
      try {
        const result = await TabsintFs.chooseFolder();
        this.diskModel.updateDiskModel({ contentURI: result.uri });
      } catch (error) {
        this.logger.error('Error selecting folder: ' + JSON.stringify(error));
      }
    }

    this.fileService.rootUri = this.disk.contentURI;

    this.fileService.createTabsintDirectoriesIfDontExist();

    if (!_.isUndefined(this.disk.activeProtocolMeta) && this.disk.activeProtocolMeta.name != '')
      await this.protocolService.load(this.disk.activeProtocolMeta);
    if (this.disk.showDisclaimer || this.disk.showDisclaimer == undefined) {
      this.openDisclaimer();
      this.diskModel.updateDiskModel({ showDisclaimer: false });
    }
    await this.devicesService.initialize();
    this.setupNetworkListener();
  }

  openDisclaimer() {
    this.dialog.open(DisclaimerComponent, {
      width: '500px',
      disableClose: true,
    });
  }

  /**
   * Setup a network listener to update wifi status.
   */
  private setupNetworkListener() {
    this.networkService.addListener(true, (status: { connectionType: string }) => {
      this.stateModel.updateWifiStatus(status.connectionType === 'wifi');
    });
  }
}
