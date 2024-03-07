import { Component } from '@angular/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';

import { PageModel } from '../../models/page/page.service';
import { DiskModel } from '../../models/disk/disk.service';
import { Logger } from '../../utilities/logger.service';
import { FileService } from '../../controllers/file.service';
import { AppState } from '../../utilities/constants';
import { StateModel } from '../../models/state/state.service';
import { DiskInterface } from '../../models/disk/disk.interface';
import { PageInterface } from '../../models/page/page.interface';

@Component({
  selector: 'config-view',
  templateUrl: './config.component.html',
  styleUrl: './config.component.css'
})
export class ConfigComponent {
  disk: DiskInterface;
  page: PageInterface;

  constructor(
    public diskModel:DiskModel, 
    public fileService:FileService,
    public logger:Logger, 
    public pageModel:PageModel,
    public stateModel: StateModel 
  ) { 
    this.disk = this.diskModel.getDisk();
    this.page = this.pageModel.getPage();
  }

  ngOnInit(): void {
    this.stateModel.setAppState(AppState.Admin);
  }

  title = 'config';

  logTest() {
    this.logger.debug("pageM: "+JSON.stringify(this.page));
    this.logger.debug("diskM: "+JSON.stringify(this.disk));
  }

  headsets: { [index: string]: string } = {
    None: "None",
    HDA200: "HDA200",
    VicFirth: "VicFirth",
    VicFirthS2: "VicFirthS2",
    WAHTS: "WAHTS",
    EPHD1: "EPHD1",
    Audiometer: "Audiometer"
  };

  changeHeadset(headset:string, overwrite:boolean) {

  }
  
}
