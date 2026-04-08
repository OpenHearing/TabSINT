import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { Observable, Subscription } from 'rxjs';

import { DiskInterface } from '../../../../models/disk/disk.interface';
import { VersionInterface } from '../../../../models/version/version.interface';

import { DiskModel } from '../../../../models/disk/disk.service';
import { Logger } from '../../../../services/logger.service';
import { VersionModel } from '../../../../models/version/version.service';
import { StateModel } from '../../../../models/state/state.service';
import { StateInterface } from '../../../../models/state/state.interface';
import { DevicesService } from '../../../../services/devices/devices.service';
import { IDeviceMetadata } from '../../../../interfaces/devices/device-metadata.interface';

@Component({
  selector: 'app-software-config-view',
  templateUrl: './software-config.component.html',
  styleUrl: './software-config.component.css',
})
export class SoftwareConfigComponent implements OnInit, OnDestroy {
  private readonly diskModel = inject(DiskModel);
  private readonly logger = inject(Logger);
  private readonly versionModel = inject(VersionModel);
  private readonly stateModel = inject(StateModel);
  private readonly devicesService = inject(DevicesService);

  state: StateInterface;
  disk: DiskInterface;
  diskSubscription: Subscription | undefined;
  stateSubscription: Subscription | undefined;
  hostMetadata: Observable<IDeviceMetadata>;
  version: VersionInterface;

  constructor() {
    this.disk = this.diskModel.getDisk();
    this.hostMetadata = this.devicesService.hostMetadata;
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
    this.stateSubscription = this.stateModel.stateSubject.subscribe((state: StateInterface) => {
      this.state = state;
    });
    this.initializeVersion();
  }

  ngOnDestroy(): void {
    this.diskSubscription?.unsubscribe();
    this.stateSubscription?.unsubscribe();
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
