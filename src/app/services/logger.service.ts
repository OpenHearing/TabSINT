import { Injectable } from '@angular/core';
import { Subscription } from 'rxjs';

import { DiskInterface } from '../models/disk/disk.interface';

import { DiskModel } from '../models/disk/disk.service';
import { SqLite } from './sqLite.service';

@Injectable({
  providedIn: 'root',
})
export class Logger {
  disk: DiskInterface;
  diskSubscription: Subscription | undefined;

  constructor(
    private readonly diskModel: DiskModel,
    private readonly sqLite: SqLite
  ) {
    this.disk = this.diskModel.getDisk();
    this.diskSubscription = this.diskModel.diskSubject.subscribe((updatedDisk: DiskInterface) => {
      this.disk = updatedDisk;
    });
  }

  debug(msg: string, error?: unknown) {
    this.log(msg, 'Debug: ', error);
  }

  warning(msg: string, error?: unknown) {
    this.log(msg, 'WARNING: ', error);
  }

  error(msg: string, error?: unknown) {
    this.log(msg, 'ERROR: ', error);
  }

  log(msg: string, prefix: string, error?: unknown) {
    if (!this.disk.disableLogs && this.disk.numLogRows <= this.disk.maxLogRows) {
      const err = error instanceof Error ? error.message : error;
      const logMsg = error ? `${msg}: ${err}` : msg;
      const timestamp = new Date().toISOString();
      const logMessage = `[${timestamp}]: ${logMsg}`;
      console.log(prefix + msg);
      this.sqLite.deleteOlderLogsIfThereAreTooMany();
      this.sqLite.store('logs', logMessage);
    }
  }
}
