import { Component } from '@angular/core';
import { Subscription } from 'rxjs';

import { DiskInterface } from '../../../../models/disk/disk.interface';
import { DevicesInterface } from '../../../../models/devices/devices.interface';
import { VersionInterface } from '../../../../interfaces/version.interface';
import { DevicesInterface } from '../../../../models/devices/devices.interface';
import { VersionInterface } from '../../../../models/version/version.interface';
import { DiskInterface } from '../../../../models/disk/disk.interface';

import { DiskModel } from '../../../../models/disk/disk.service';
import { Logger } from '../../../../utilities/logger.service';
import { VersionService } from '../../../../controllers/version.service';
import { VersionModel } from '../../../../models/version/version.service';
import { DevicesModel } from '../../../../models/devices/devices-model.service';

@Component({
  selector: 'software-config-view',
  templateUrl: './software-config.component.html',
  styleUrl: './software-config.component.css'
})
export class SoftwareConfigComponent {
  disk: DiskInterface;
  diskSubscription: Subscription | undefined;
  devices: DevicesInterface;
  version: VersionInterface;

  constructor(
    private readonly devicesModel: DevicesModel,
    private readonly diskModel: DiskModel,
    private readonly logger: Logger,
    private readonly versionService: VersionService,
    private versionModel: VersionModel,
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
    this.diskSubscription = this.diskModel.diskSubject.subscribe( (updatedDisk: DiskInterface) => {
        this.disk = updatedDisk;
    })
    this.initializeVersion();
  }

  ngOnDestroy() {
    this.diskSubscription?.unsubscribe();
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
