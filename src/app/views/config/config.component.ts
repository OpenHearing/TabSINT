import { Component } from '@angular/core';
import { PageM } from '../../models/page/page.service';

@Component({
  selector: 'config-view',
  templateUrl: './config.component.html',
  styleUrl: './config.component.css'
})
export class ConfigComponent {

  constructor(public pageM:PageM) {  }

  title = 'config';

  logTest() {
    console.log("pageM: "+JSON.stringify(this.pageM.pageM));
  }
  
}
