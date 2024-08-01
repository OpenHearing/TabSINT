import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from "@ngx-translate/core";
import { DiskInterface } from './models/disk/disk.interface';
import { DiskModel } from './models/disk/disk.service';
import { VersionService } from './controllers/version.service';
import { DevicesModel } from './models/devices/devices.service';
import { TabsintFs } from 'tabsintfs';
import { AppModel } from './models/app/app.service';
import { AppInterface } from './models/app/app.interface';
import { SqLite } from './utilities/sqLite.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'tabsint';
  app: AppInterface;
  disk: DiskInterface;

  constructor(    
    public appModel: AppModel,
    private sqLite: SqLite,
    private router: Router,
    private translate: TranslateService,
    public diskModel: DiskModel
  ) {
    this.translate.setDefaultLang('English');
    this.translate.use('English');
    this.app = appModel.getApp();
    this.disk = this.diskModel.getDisk();
  }

  async ngOnInit() {
    this.sqLite.init();
    this.router.navigate([''])
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

