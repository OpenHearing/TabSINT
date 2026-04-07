import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Subscription } from 'rxjs';
import { CapacitorSQLite, CapacitorSQLitePlugin, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';

import { NumDictionary } from '../interfaces/num-dictionary.interface';
import { DiskInterface } from '../models/disk/disk.interface';
import { AppInterface } from '../models/app/app.interface';

import { AppModel } from '../models/app/app.service';
import { DiskModel } from '../models/disk/disk.service';

import { createLogsTableSql, createResultsTableSql, deleteOldLogsSql } from '../utilities/constants';

@Injectable({
  providedIn: 'root',
})
export class SqLite {
  disk: DiskInterface;
  diskSubscription: Subscription | undefined;
  app: AppInterface;
  count: NumDictionary = {
    logs: 0,
    results: 0,
  };
  countSubject = new BehaviorSubject<NumDictionary>(this.count);
  sqlitePlugin!: CapacitorSQLitePlugin;
  sqliteConnection!: SQLiteConnection;

  private readonly appModel = inject(AppModel);
  private readonly diskModel = inject(DiskModel);

  private db!: SQLiteDBConnection;

  constructor() {
    this.sqlitePlugin = CapacitorSQLite;
    this.disk = this.diskModel.getDisk();
    this.diskSubscription = this.diskModel.diskSubject.subscribe((updatedDisk: DiskInterface) => {
      this.disk = updatedDisk;
    });
    this.app = this.appModel.getApp();
  }

  async init() {
    await this.initializePlugin();
    await this.initializeWeb();
    await this.open();
    const logs = await this.getAllLogs();
    const results = await this.getAllResultsRaw();
    this.count = {
      logs: logs?.length ?? 0,
      results: results?.length ?? 0,
    };
  }

  async store(tableName: string, data: string) {
    try {
      if (this.db) {
        const sql = 'INSERT INTO ' + tableName + ' (data) VALUES (?)';
        await this.db.run(sql, [data]);
        this.count[tableName] += 1;
        this.countSubject.next(this.count);
      }
    } catch (e) {
      console.log('SQLITE Error storing ' + tableName + ' with error ' + e);
    }
  }

  async getSingleResult(index: number) {
    const sql = 'SELECT data FROM results LIMIT 1 OFFSET ?';
    const res = (await this.db.query(sql, [index])).values!.map(res => res.data);
    return JSON.parse(JSON.stringify(res));
  }

  async getAllResults() {
    const sql = 'SELECT data FROM results';
    return (await this.db.query(sql)).values?.map(res => JSON.parse(res.data));
  }

  async getAllResultsRaw(): Promise<string[]> {
    const sql = 'SELECT data FROM results';
    return (await this.db.query(sql)).values?.map(res => res.data) ?? [];
  }

  async getAllLogs() {
    const sql = 'SELECT data FROM logs';
    return (await this.db.query(sql)).values?.map(log => log.data);
  }

  async deleteSingleResult(index: number) {
    try {
      const sql = `DELETE FROM results WHERE msgID in 
                            (SELECT msgID FROM 
                                (SELECT msgID FROM results ORDER BY msgID LIMIT 1 OFFSET ?) 
                            AS subquery )
                        `;
      await this.db.run(sql, [index]);
      this.count['results'] -= 1;
      this.countSubject.next(this.count);
    } catch (e) {
      console.log('SQLITE Error deleting result ' + index + ' with error ' + e);
    }
  }

  async deleteAll(tableName: string) {
    const query = 'DELETE FROM ' + tableName;
    try {
      await this.db.run(query);
      this.count[tableName] = 0;
      this.countSubject.next(this.count);
    } catch (e) {
      console.log('SQLITE Error deleting all ' + tableName + ' with error: ' + e);
    }
  }

  async deleteOlderLogsIfThereAreTooMany() {
    const delCount = this.count['logs'] - this.disk.preferences.maxLogRows + 1;
    if (delCount > 0) {
      try {
        await this.db.executeSet([{ statement: deleteOldLogsSql, values: [delCount] }]);
        this.count['logs'] -= delCount;
        this.countSubject.next(this.count);
      } catch (e) {
        console.log('SQLITE Error deleting ' + delCount + ' logs with error ' + e);
      }
    }
  }

  private async initializePlugin() {
    this.sqlitePlugin = CapacitorSQLite;
    this.sqliteConnection = new SQLiteConnection(this.sqlitePlugin);
    return true;
  }

  private async initializeWeb() {
    if (this.app.browser === true) {
      await customElements.whenDefined('jeep-sqlite');
      const jeepSqliteEl = document.querySelector('jeep-sqlite');
      if (jeepSqliteEl != null) {
        await this.sqliteConnection.initWebStore();
      }
    }
    return true;
  }

  private async open() {
    const database = 'storage';
    this.db = await this.sqliteConnection.createConnection(database, false, 'no-encryption', 1, false);
    await this.db.open();
    await this.db.execute(createResultsTableSql);
    await this.db.execute(createLogsTableSql);
  }
}
