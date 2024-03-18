import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'log-config-view',
  templateUrl: './log-config.component.html',
  styleUrl: './log-config.component.css'
})
export class LogConfigComponent {

  constructor(public translate: TranslateService) {  }

  logs = {
    count: {
      newlogs:"???"
    },
    show: false,
    nLogs: 50,
    disp: []
  };

  tasks = {
    disabled: true
  }

  displayLogs() {
    console.log("displayLogs pressed");
  }

  logExportUpload(param:boolean) {
    console.log("logExport pressed");
  }

  logExportSave(param:boolean) {
    console.log("logExport pressed");
  }

}
