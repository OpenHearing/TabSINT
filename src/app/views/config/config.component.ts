import { Component } from '@angular/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';

import { PageM } from '../../models/page/page.service';
import { DiskM } from '../../models/disk/disk.service';
import { Logger } from '../../utilities/logger.service';
import { File } from '../../controllers/file.service';

@Component({
  selector: 'config-view',
  templateUrl: './config.component.html',
  styleUrl: './config.component.css'
})
export class ConfigComponent {

  constructor(public pageM:PageM, public diskM:DiskM, public logger:Logger, public file:File) {  }

  title = 'config';

  logTest() {
    this.logger.debug("pageM: "+JSON.stringify(this.pageM.pageM));
    this.logger.debug("diskM: "+JSON.stringify(this.diskM.diskM));
  }
  
}
