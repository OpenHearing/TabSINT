import { Component } from '@angular/core';
import { Subscription } from 'rxjs';

import { DiskInterface } from '../../../../models/disk/disk.interface';
import { DevicesInterface } from '../../../../models/devices/devices.interface';
import { VersionInterface } from '../../../../interfaces/version.interface';

import { DiskModel } from '../../../../models/disk/disk.service';
import { Logger } from '../../../../utilities/logger.service';
import { VersionService } from '../../../../controllers/version.service';
import { DevicesModel } from '../../../../models/devices/devices-model.service';

@Component({
  selector: 'software-config-view',
  templateUrl: './software-config.component.html',
  styleUrl: './software-config.component.css'
})
export class SoftwareConfigComponent {
  disk: DiskInterface;
  diskSubject: Subscription | undefined;
  devices: DevicesInterface;
  version: VersionInterface;
  
  constructor(
    private readonly devicesModel: DevicesModel,
    private readonly diskModel: DiskModel, 
    private readonly logger: Logger, 
    private readonly versionService: VersionService,
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
    this.diskSubject = this.diskModel.diskSubject.subscribe( (updatedDisk: DiskInterface) => {
        this.disk = updatedDisk;
    })    
    this.initializeVersion();
  }

  ngOnDestroy() {
    this.diskSubject?.unsubscribe();
  }

  private async initializeVersion(): Promise<void> {
    try {
      this.version = await this.versionService.getVersion();
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
