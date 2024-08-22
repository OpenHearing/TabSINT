import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Tasks } from '../../utilities/tasks.service';
import { SqLite } from '../../utilities/sqLite.service';
import { StateModel } from '../../models/state/state.service';
import { StateInterface } from '../../models/state/state.interface';
import { FileService } from '../../utilities/file.service';
import { DialogDataInterface } from '../../interfaces/dialog-data.interface';
import { DialogType } from '../../utilities/constants';
import { Notifications } from '../../utilities/notifications.service';

@Component({
  selector: 'log-config-view',
  templateUrl: './log-config.component.html',
  styleUrl: './log-config.component.css'
})
export class LogConfigComponent {

  state: StateInterface;
  showLogs: boolean;
  logs?: string[] = [];

  constructor(
    public translate: TranslateService,
    public stateModel: StateModel,
    private sqLite: SqLite,
    private tasks: Tasks,
    private fileService:FileService,
    private notifications: Notifications
  ) { 
    this.state = this.stateModel.getState();
    this.showLogs = this.state.isPaneOpen.appLog;
  }

  async ngOnInit() {
    console.log('LOGS', this.logs);
  }

  logsCount = this.sqLite.count['logs'];

  async displayLogs() {
    this.showLogs = !this.showLogs;
    this.logs = await this.sqLite.getAllLogs();
    console.log('LOGS ARE----' + this.logs);
  }

  // async logExportUpload() {
      
  // } 

  async logExportSave() {
      this.logs = await this.sqLite.getAllLogs();
      if (!this.logs || this.logs.length==0){
        console.log("Nothing to Export");
        return;
      }
      let msg: DialogDataInterface = {
        title: "Confirm Export",
        content: "Are you sure you want to export the logs to .tabsintlogs?",
        type: DialogType.Confirm
      };
      this.notifications.confirm(msg).subscribe(async (result: string) => {
        if (result === "OK") {
          try {
            const currentTimeStamp = new Date().toISOString();
            const formattedLogs = this.logs!.map((log, index) => ({
              msgID: index + 1,
              date: currentTimeStamp,
              data: log,
            }));
            const logData = JSON.stringify({ logs: formattedLogs }, null, 2);
            const filename = `.tabsintlogs/${currentTimeStamp}.json`;
            await this.fileService.writeFile(filename,logData)
        } catch (error){
          console.error('Error exporting logs:', error);
        }
        } else {
          console.log('Export canceled.');
        }
      });
  }

}
