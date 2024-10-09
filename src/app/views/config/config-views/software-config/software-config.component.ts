import { Component } from '@angular/core';

import { DiskModel } from '../../../../models/disk/disk.service';
import { Logger } from '../../../../utilities/logger.service';
import { VersionModel } from '../../../../models/version/version.service';
import { DiskInterface } from '../../../../models/disk/disk.interface';
import { DevicesModel } from '../../../../models/devices/devices-model.service';
import { DevicesInterface } from '../../../../models/devices/devices.interface';
import { VersionInterface } from '../../../../models/version/version.interface';

@Component({
  selector: 'software-config-view',
  templateUrl: './software-config.component.html',
  styleUrl: './software-config.component.css'
})
export class SoftwareConfigComponent {
  disk: DiskInterface;
  devices: DevicesInterface;
  version: VersionInterface;
  constructor(
    private diskModel: DiskModel, 
    private VersionModel: VersionModel,
    private devicesModel: DevicesModel,
    private logger: Logger, 
  ) { 
    this.disk = this.diskModel.getDisk();
    this.devices = this.devicesModel.getDevices();
    this.version = {
      tabsint: '',
      date: '',
      rev: '',
      version_code: '',
      deps: {
          user_agent: '',
          node: '',
          capacitor: ''
      },
      plugins: []
  };
  }

  ngOnInit(): void {
    this.initializeVersion();
  }

  private async initializeVersion(): Promise<void> {
    try {
      this.version = await this.VersionModel.getVersion();
    } catch (error) {
      this.logger.error("" + error);
    }
  }

  // TODO: VARIABLES - SHOULD BE MOVED TO THE RESPECTIVE MODEL WHEN IT EXISTS

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
