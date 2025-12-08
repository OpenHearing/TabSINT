import { Component } from '@angular/core';
import { Subscription } from 'rxjs';

import { DiskInterface } from '../../../../models/disk/disk.interface';
import { DevicesInterface } from '../../../../models/devices/devices.interface';
import { VersionInterface } from '../../../../models/version/version.interface';

import { DiskModel } from '../../../../models/disk/disk.service';
import { Logger } from '../../../../services/logger.service';
import { VersionModel } from '../../../../models/version/version.service';
import { DevicesModel } from '../../../../models/devices/devices-model.service';
import { StateModel } from '../../../../models/state/state.service';
import { StateInterface } from '../../../../models/state/state.interface';

@Component({
  selector: 'software-config-view',
  templateUrl: './software-config.component.html',
  styleUrl: './software-config.component.css',
})
export class SoftwareConfigComponent {
  state: StateInterface;
  disk: DiskInterface;
  diskSubscription: Subscription | undefined;
  devices: DevicesInterface;
  version: VersionInterface;

  constructor(
    private readonly devicesModel: DevicesModel,
    private readonly diskModel: DiskModel,
    private readonly logger: Logger,
    private readonly versionModel: VersionModel,
    private readonly stateModel: StateModel
  ) {
    this.disk = this.diskModel.getDisk();
    this.devices = this.devicesModel.getDevices();
    this.state = this.stateModel.getState();
    this.version = {
      tabsint: '',
      date: '',
      rev: '',
      version_code: '',
      deps: {
        user_agent: '',
        node: '',
        capacitor: '',
      },
      plugins: [],
    };
  }

  ngOnInit(): void {
    this.diskSubscription = this.diskModel.diskSubject.subscribe((updatedDisk: DiskInterface) => {
      this.disk = updatedDisk;
    });
    this.initializeVersion();
  }

  ngOnDestroy(): void {
    this.diskSubscription?.unsubscribe();
  }

  private async initializeVersion(): Promise<void> {
    try {
      this.version = await this.versionModel.getVersion();
    } catch (error) {
      this.logger.error(JSON.stringify(error));
    }
  }

  toggleAppDeveloperMode() {
    this.logger.debug('toggleAppDeveloperMode');
  }
}
