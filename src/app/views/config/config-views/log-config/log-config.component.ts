import { Component, ElementRef, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import { SqLite } from '../../../../services/sqLite.service';
import { StateModel } from '../../../../models/state/state.service';
import { StateInterface } from '../../../../models/state/state.interface';
import { FileService } from '../../../../services/file.service';
import { DialogDataInterface } from '../../../../interfaces/dialog-data.interface';
import { DialogType } from '../../../../utilities/constants';
import { Notifications } from '../../../../services/notifications.service';
import { Logger } from '../../../../services/logger.service';
import { Subscription } from 'rxjs/internal/Subscription';

@Component({
  selector: 'app-log-config-view',
  templateUrl: './log-config.component.html',
  styleUrl: './log-config.component.css',
})
export class LogConfigComponent implements OnInit, OnDestroy {
  readonly transloco = inject(TranslocoService);
  readonly stateModel = inject(StateModel);
  readonly logger = inject(Logger);
  private readonly sqLite = inject(SqLite);
  private readonly fileService = inject(FileService);
  private readonly notifications = inject(Notifications);

  @ViewChild('logContainer') logContainer?: ElementRef<HTMLDivElement>;

  state: StateInterface;
  showLogs: boolean;
  logs?: string[] = [];
  logsCount: number = 0;

  // Subscriptions
  logsCountSubscription: Subscription | undefined;
  stateSubscription: Subscription | undefined;

  constructor() {
    this.state = this.stateModel.getState();
    this.showLogs = this.state.isPaneOpen.appLog;
  }

  ngOnInit(): void {
    this.logsCountSubscription = this.sqLite.countSubject.subscribe(async updatedLogsCount => {
      this.logsCount = updatedLogsCount['logs'];
      this.logs = await this.sqLite.getAllLogs();
    });
    this.stateSubscription = this.stateModel.stateSubject.subscribe(updatedState => {
      this.state = updatedState;
    });
  }

  ngOnDestroy(): void {
    this.logsCountSubscription?.unsubscribe();
    this.stateSubscription?.unsubscribe();
  }

  async displayLogs() {
    this.showLogs = !this.showLogs;
    if (this.showLogs) {
      setTimeout(() => this.scrollToBottom());
    }
  }

  private scrollToBottom(): void {
    const container = this.logContainer?.nativeElement;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }

  // async logExportUpload() {

  // }

  async logExportSave() {
    this.logs = await this.sqLite.getAllLogs();
    if (!this.logs || this.logs.length == 0) {
      return;
    }
    const msg: DialogDataInterface = {
      title: 'Confirm Export',
      content: 'Are you sure you want to export the logs to tabsint-logs?',
      type: DialogType.Confirm,
    };
    this.notifications.alert(msg).subscribe(async (result: string) => {
      if (result === 'OK') {
        this.exportLogs();
        await this.sqLite.deleteAll('logs');
        this.displayLogs();
        this.logsCount = this.sqLite.count['logs'];
      } else {
        this.logger.debug('Export canceled.');
      }
    });
  }

  private async exportLogs() {
    try {
      const currentTimeStamp = new Date().toISOString();
      const formattedLogs = this.logs!.map((log, index) => ({
        msgID: index + 1,
        date: currentTimeStamp,
        data: log,
      }));
      const logData = JSON.stringify({ logs: formattedLogs }, null, 2);
      const filename = `tabsint-logs/${currentTimeStamp}.json`;
      await this.fileService.writeFile(filename, logData);
    } catch (error) {
      this.logger.error('Error exporting logs: ' + JSON.stringify(error));
    }
  }
}
