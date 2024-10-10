import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from "@ngx-translate/core";
import _ from 'lodash';
import { Subscription } from 'rxjs';


import { TabsintFs } from 'tabsintfs';

import { DiskInterface } from './models/disk/disk.interface';
import { AppInterface } from './models/app/app.interface';
import { ProtocolModelInterface } from './models/protocol/protocol.interface';

import { DiskModel } from './models/disk/disk.service';
import { AppModel } from './models/app/app.service';
import { ProtocolService } from './controllers/protocol.service';
import { ProtocolModel } from './models/protocol/protocol-model.service';
import { SqLite } from './utilities/sqLite.service';
import { Logger } from './utilities/logger.service';
import { FileService } from './utilities/file.service';
import { DeviceUtil } from './utilities/device-utility';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html'
})
export class AppComponent implements OnInit {
  title = 'tabsint';
  app: AppInterface;
  disk: DiskInterface;
  diskSubscription: Subscription |undefined;
  protocol: ProtocolModelInterface;

  constructor(    
    private readonly appModel: AppModel,
    private readonly deviceUtil: DeviceUtil,
    private readonly diskModel: DiskModel,
    private readonly fileService:FileService,
    private readonly logger: Logger,
    private readonly protocolM: ProtocolModel,
    private readonly protocolService: ProtocolService,
    private readonly router: Router,
    private readonly sqLite: SqLite,
    private readonly translate: TranslateService
  ) {
    this.translate.setDefaultLang('English');
    this.translate.use('English');
    this.app = this.appModel.getApp();
    this.protocol = this.protocolM.getProtocolModel();
    this.diskModel.updateDiskModel('numLogRows',1);
    this.disk = this.diskModel.getDisk();
  }

  async ngOnInit() {
    this.diskSubscription = this.diskModel.diskSubject.subscribe( (updatedDisk: DiskInterface) => {
        this.disk = updatedDisk;
    })

    await this.sqLite.init();
    this.router.navigate(['']);

    if (!this.disk.contentURI) {
      try {
        const result = await TabsintFs.chooseFolder();
        this.diskModel.updateDiskModel('contentURI', result.uri);
      } catch (error) {
        this.logger.error('Error selecting folder: '+JSON.stringify(error));
      }
    }
    this.fileService.rootUri = this.disk.contentURI ;
    
    this.fileService.createTabsintDirectoriesIfDontExist();

    if (!_.isUndefined(this.disk.activeProtocolMeta) && (this.disk.activeProtocolMeta.name != '')) await this.protocolService.load(this.disk.activeProtocolMeta);

    this.deviceUtil.addSavedDevices();
  }
  
  ngOnDestroy() {
    this.diskSubscription?.unsubscribe();
  }

}

