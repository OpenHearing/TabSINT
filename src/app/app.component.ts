import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from "@ngx-translate/core";
import _ from 'lodash';

import { TabsintFs } from 'tabsintfs';

import { ProtocolService } from './controllers/protocol.service';

import { DiskInterface } from './models/disk/disk.interface';
import { DiskModel } from './models/disk/disk.service';
import { AppModel } from './models/app/app.service';
import { AppInterface } from './models/app/app.interface';
import { ProtocolModel } from './models/protocol/protocol-model.service';
import { ProtocolModelInterface } from './models/protocol/protocol.interface';

import { SqLite } from './utilities/sqLite.service';
import { Logger } from './utilities/logger.service';
import { FileService } from './utilities/file.service';
import { Tasks } from './utilities/tasks.service';
import { DeviceUtil } from './utilities/device-utility';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html'
})
export class AppComponent implements OnInit {
  title = 'tabsint';
  app: AppInterface;
  disk: DiskInterface;
  protocol: ProtocolModelInterface;

  constructor(    
    private readonly appModel: AppModel,
    private readonly protocolM: ProtocolModel,
    private readonly diskModel: DiskModel,
    private readonly fileService:FileService,
    private readonly logger: Logger,
    private readonly protocolService: ProtocolService,
    private readonly router: Router,
    private readonly sqLite: SqLite,
    private readonly translate: TranslateService,
    private readonly tasks: Tasks,
    private readonly deviceUtil: DeviceUtil
  ) {
    this.translate.setDefaultLang('English');
    this.translate.use('English');
    this.app = this.appModel.getApp();
    this.disk = this.diskModel.getDisk();
    this.protocol = this.protocolM.getProtocolModel();
    this.diskModel.updateDiskModel('numLogRows',1);
  }

  async ngOnInit() {
    await this.sqLite.init();
    this.router.navigate(['']);

    if (!this.diskModel.disk.contentURI) {
      try {
        const result = await TabsintFs.chooseFolder();
        this.diskModel.updateDiskModel('contentURI', result.uri);
      } catch (error) {
        this.logger.error('Error selecting folder: '+JSON.stringify(error));
      }
    }
    this.fileService.rootUri = this.diskModel.getDisk().contentURI ;
    
    this.fileService.createTabsintDirectoriesIfDontExist();

    if (!_.isUndefined(this.disk.activeProtocolMeta)) await this.protocolService.load(this.disk.activeProtocolMeta);

    this.deviceUtil.addSavedDevices();
  }
}

