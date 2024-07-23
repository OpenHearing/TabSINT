import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ProtocolService } from './controllers/protocol.service';
import { TranslateService } from "@ngx-translate/core";
import { DiskModel } from './models/disk/disk.service';
import { VersionService } from './controllers/version.service';
import { DevicesModel } from './models/devices/devices.service';
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

  constructor(
    private sqLite: SqLite,
    private router: Router,
    private translate: TranslateService,
    private versionService: VersionService,
    private devicesModel: DevicesModel
  ) {
    translate.setDefaultLang('English');
    translate.use('English');
  }

  ngOnInit() {
    this.sqLite.init();
    this.router.navigate([''])
  }
}
