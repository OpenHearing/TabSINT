import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

import { DiskModel } from '../../models/disk/disk.service';
import { Logger } from '../../utilities/logger.service';
import { AdminService } from '../../controllers/admin.service';
import { VersionService } from '../../controllers/version.service';
import { DiskInterface } from '../../models/disk/disk.interface';

@Component({
  selector: 'software-config-view',
  templateUrl: './software-config.component.html',
  styleUrl: './software-config.component.css'
})
export class SoftwareConfigComponent {
  disk: DiskInterface;
  version: any; // TODO: add type

  constructor(
    public diskModel: DiskModel, 
    public adminService: AdminService,
    public versionService: VersionService,
    public logger: Logger, 
    public translate: TranslateService
  ) { 
    this.disk = this.diskModel.getDisk();
    this.version = this.versionService.getVersion();
  }

  // TODO: VARIABLES - SHOULD BE MOVED TO THE RESPECTIVE MODEL WHEN IT EXISTS

  devices = {
    name: "Browser",
    cordova: "Browser",
    platform: "Browser",
    UUID: "Browser",
    shortUUID: "Browser",
    tabsintUUID: undefined,
    version: "Browser",
    model: "Browser",
    diskSpace: "Broswer",
    load: undefined
  };

  networkModel: any = {
    "status": false,
    "type": "???"
  };

  config = {
    build: "placeholder",
    tabsintPlugins: {
      "???": {version:"???"}
    }
  }


  toggleAppDeveloperMode() {
    console.log("toggleAppDeveloperMode");
  }

}
