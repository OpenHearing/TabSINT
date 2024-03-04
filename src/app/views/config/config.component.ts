import { Component } from '@angular/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';

import { PageM } from '../../models/page/page.service';
import { DiskM } from '../../models/disk/disk.service';
import { Logger } from '../../utilities/logger.service';
import { File } from '../../controllers/file.service';
import { AppState } from '../../utilities/constants';
import { StateM } from '../../models/state/state.service';

@Component({
  selector: 'config-view',
  templateUrl: './config.component.html',
  styleUrl: './config.component.css'
})
export class ConfigComponent {

  constructor(
    public diskM:DiskM, 
    public file:File,
    public logger:Logger, 
    public pageM:PageM,
    public stateM: StateM 
  ) {  }

  ngOnInit(): void {
    this.stateM.setAppState(AppState.Admin);
  }

  title = 'config';

  logTest() {
    this.logger.debug("pageM: "+JSON.stringify(this.pageM.pageM));
    this.logger.debug("diskM: "+JSON.stringify(this.diskM.diskM));
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
