import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Tasks } from '../../utilities/tasks.service';
import { SqLite } from '../../utilities/sqLite.service';
import { StateModel } from '../../models/state/state.service';
import { StateInterface } from '../../models/state/state.interface';

@Component({
  selector: 'log-config-view',
  templateUrl: './log-config.component.html',
  styleUrl: './log-config.component.css'
})
export class LogConfigComponent {

  state: StateInterface;
  showLogs: boolean;
  logs?: String[];

  constructor(
    public translate: TranslateService,
    public stateModel: StateModel,
    private sqLite: SqLite,
    private tasks: Tasks
  ) { 
    this.state = this.stateModel.getState();
    this.showLogs = this.state.isPaneOpen.appLog;
  }

  async ngOnInit() {
    this.logs = await this.sqLite.getAllLogs();
    console.log('LOGS', this.logs);
  }

  logsCount = this.sqLite.count['logs'];

  displayLogs() {
    console.log("displayLogs pressed");
  }

  logExportUpload() {
    console.log("logExport pressed");
  }

  logExportSave() {
    console.log("logExport pressed");
  }

}
