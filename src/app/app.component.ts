import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ProtocolService } from './controllers/protocol.service';
import { TranslateService } from "@ngx-translate/core";
import { DiskModel } from './models/disk/disk.service';
import { VersionService } from './controllers/version.service';
import { DevicesModel } from './models/devices/devices.service';
import { TabsintFs } from 'tabsintfs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'tabsint';
  
  constructor(
    private protocolService: ProtocolService,
    private diskModel: DiskModel,
    private router: Router,
    private translate: TranslateService,
    private versionService: VersionService,
    private devicesModel: DevicesModel
  ) { 
    translate.setDefaultLang('English');
    translate.use('English');
    this.diskModel.updateDiskModel('numLogRows',1)
  }

  async ngOnInit() {
    this.protocolService.init();
    this.router.navigate(['']);
    if (this.diskModel.disk.contentURI === '') {
      try {
        const result = await TabsintFs.chooseFolder();
        this.diskModel.updateDiskModel('contentURI', result.uri); // Update the contentURI with the selected folder URI
      } catch (error) {
        console.error('Error selecting folder:', error);
      }
    }
  }
}

