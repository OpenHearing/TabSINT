import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ProtocolService } from './controllers/protocol.service';
import { TranslateService } from "@ngx-translate/core";
import { DiskModel } from './models/disk/disk.service';
import { AppModel } from './models/app/app.service';
import { AppInterface } from './models/app/app.interface';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'tabsint';
  app: AppInterface;
  
  constructor(
    public appModel: AppModel,
    private protocolService: ProtocolService,
    private diskModel: DiskModel,
    private router: Router,
    private translate: TranslateService
  ) { 
    translate.setDefaultLang('English');
    translate.use('English');
    this.app = appModel.getApp();
  }

  ngOnInit() {
    this.protocolService.init();
    this.router.navigate([''])
  }
}
