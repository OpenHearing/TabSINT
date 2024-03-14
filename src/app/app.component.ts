import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ProtocolService } from './controllers/protocol.service';
import {TranslateService} from "@ngx-translate/core";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'tabsint';
  
  constructor(
    private protocolService: ProtocolService,
    private router: Router,
    private translate: TranslateService
  ) { 
    translate.setDefaultLang('English');
    translate.use('English');
  }

  ngOnInit() {
    this.protocolService.init();
    this.router.navigate([''])
  }
}
