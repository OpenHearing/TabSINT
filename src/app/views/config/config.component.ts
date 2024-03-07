import { Component } from '@angular/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';

import { PageM } from '../../models/page/page.service';
import { DiskModel } from '../../models/disk/disk.service';
import { Logger } from '../../utilities/logger.service';
import { FileService } from '../../controllers/file.service';
import { AppState } from '../../utilities/constants';
import { StateM } from '../../models/state/state.service';
import { DiskInterface } from '../../models/disk/disk.interface';

@Component({
  selector: 'config-view',
  templateUrl: './config.component.html',
  styleUrl: './config.component.css'
})
export class ConfigComponent {
  disk: DiskInterface;

  constructor(
    public diskModel:DiskModel, 
    public file:FileService,
    public logger:Logger, 
    public pageM:PageM,
    public stateM: StateM 
  ) { 
    this.disk = this.diskModel.getDisk(); }

  ngOnInit(): void {
    this.stateM.setAppState(AppState.Admin);
  }

  title = 'config';

  logTest() {
    this.logger.debug("pageM: "+JSON.stringify(this.pageM.pageM));
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
