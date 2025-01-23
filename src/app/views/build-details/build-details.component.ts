import { Component, OnInit } from '@angular/core';
import { VersionModel } from '../../models/version/version.service';
import { VersionInterface } from '../../models/version/version.interface';
import { Logger } from '../../utilities/logger.service';
import { DevicesModel } from '../../models/devices/devices-model.service';
import { DevicesInterface } from '../../models/devices/devices.interface';

@Component({
  selector: 'build-details',
  templateUrl: './build-details.component.html',
  styleUrl: './build-details.component.css'
})
export class BuildDetailsComponent implements OnInit {
  version: VersionInterface | undefined;
  devices: DevicesInterface | undefined;

  constructor(
    private readonly versionModel: VersionModel, 
    private readonly logger: Logger,
    private readonly devicesModel: DevicesModel
  ) {
    this.devices = this.devicesModel.getDevices();
  }

  ngOnInit(): void {
    this.initializeVersion();
  }

  private async initializeVersion(): Promise<void> {
    try {
      this.version = await this.versionModel.getVersion();
    } catch (error) {
      this.logger.error("" + error);
    }
  }

}
