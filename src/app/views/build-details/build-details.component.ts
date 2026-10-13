import { Component, OnInit, inject } from '@angular/core';
import { VersionModel } from '../../models/version/version.service';
import { VersionInterface } from '../../models/version/version.interface';
import { Logger } from '../../services/logger.service';

@Component({
  selector: 'app-build-details',
  templateUrl: './build-details.component.html',
  styleUrl: './build-details.component.css',
})
export class BuildDetailsComponent implements OnInit {
  private readonly versionModel = inject(VersionModel);
  private readonly logger = inject(Logger);

  version: VersionInterface | undefined;

  ngOnInit(): void {
    this.initializeVersion();
  }

  private async initializeVersion(): Promise<void> {
    try {
      this.version = await this.versionModel.getVersion();
    } catch (error) {
      this.logger.error(JSON.stringify(error));
    }
  }
}
