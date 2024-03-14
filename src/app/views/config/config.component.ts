import { Component } from '@angular/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { TranslateService } from '@ngx-translate/core';

import { PageModel } from '../../models/page/page.service';
import { DiskModel } from '../../models/disk/disk.service';
import { Logger } from '../../utilities/logger.service';
import { FileService } from '../../controllers/file.service';
import { AppState } from '../../utilities/constants';
import { StateModel } from '../../models/state/state.service';
import { DiskInterface } from '../../models/disk/disk.interface';
import { PageInterface } from '../../models/page/page.interface';
import { StateInterface } from '../../models/state/state.interface';

@Component({
  selector: 'config-view',
  templateUrl: './config.component.html',
  styleUrl: './config.component.css'
})
export class ConfigComponent {
  disk: DiskInterface;
  page: PageInterface;
  state: StateInterface

  constructor(
    public diskModel:DiskModel, 
    public fileService:FileService,
    public logger:Logger, 
    public pageModel:PageModel,
    public stateModel: StateModel,
    public translate: TranslateService
  ) { 
    this.disk = this.diskModel.getDisk();
    this.page = this.pageModel.getPage();
    this.state = this.stateModel.getState();
  }

  ngOnInit(): void {
    this.stateModel.setAppState(AppState.Admin);
  }

  title = 'config';

  logTest() {
    this.logger.debug("pageM: "+JSON.stringify(this.page));
    this.logger.debug("diskM: "+JSON.stringify(this.disk));
  }

  headsets:Array<string> = [
    "None",
    "HDA200",
    "VicFirth",
    "VicFirthS2",
    "WAHTS",
    "EPHD1",
    "Audiometer"
  ];

  languages:Array<string> = [
    this.translate.instant("English"),
    this.translate.instant("Japanese"),
    this.translate.instant("French"),
    this.translate.instant("Spanish"),
  ];

  changeHeadset(headset:string) {
    this.disk.headset = headset;
    this.logger.debug("Headset changed to: "+headset);
  }

  changeLanguage(language:string) {
    this.disk.language = language;
    // need to update the language here
    this.translate.setDefaultLang(language);
    this.logger.debug("Language changed to: "+language);
  }

  onPopoverShow($event:any) {
    console.log($event);
  }
  
}
