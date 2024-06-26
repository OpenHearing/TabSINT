import { Injectable } from '@angular/core';import { CapacitorSQLite, CapacitorSQLitePlugin, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';

import { NumDictionary } from '../interfaces/num-dictionary.interface';
import { DevicesInterface } from '../models/devices/devices.interface';
import { DiskInterface } from '../models/disk/disk.interface';
import { AppModel } from '../models/app/app.service';
import { DiskModel } from '../models/disk/disk.service';
import { Logger } from './logger.service';
import { createLogsTableSql, createResultsTableSql, deleteSql } from './constants';

@Injectable({
    providedIn: 'root',
})

export class SqLite {
    disk: DiskInterface;    
    count: NumDictionary ={
        logs: 0,
        results: 0
    };
    sqlitePlugin!: CapacitorSQLitePlugin;
    sqliteConnection!: SQLiteConnection;
    
    private db!: SQLiteDBConnection;

    constructor (
        private app: AppModel,
        private diskModel: DiskModel,
        private logger: Logger
    ) {
        this.sqlitePlugin = CapacitorSQLite;
        this.disk = this.diskModel.getDisk();
        if (app.getApp().tablet) this.init();
    }

    private async init() {
        this.sqlitePlugin = CapacitorSQLite;
        this.sqliteConnection = new SQLiteConnection(this.sqlitePlugin);
        this.open();
    }

    private async open() {
        const database: string = 'storage';
        this.db = await this.sqliteConnection.createConnection(database, false, 'no-encryption', 1, false);
        await this.db.open();
        await this.db.execute(createResultsTableSql);
        await this.db.execute(createLogsTableSql);
    }
    
    async store(
        tableName: string, 
        date: string, 
        type: string, 
        data: string, 
        param: DevicesInterface
    ) {

        if (tableName === "logs") {
            this.deleteOlderLogsIfThereAreTooMany();
        }

        await this.db.executeSet([{ 
            statement: "INSERT INTO " + tableName + 
                " (date, data, type, uuid, siteID, build, version, platform, model, os, other) VALUES (?,?,?,?,?,?,?,?,?,?,?)",
            values: [date,
                data,
                type,
                param.uuid,
                param.protocolId,
                param.build,
                param.version,
                param.platform,
                param.model,
                param.os,
                param.other]
            }]
        );

        this.count[tableName] += 1;

      };
  
    async getSingleResult(index: number) {
        return await this.db.query('SELECT * FROM results LIMIT 1 OFFSET ?', [index]);
    }

    async deleteSingleResult(index: number) {
        await this.db.executeSet([{
            statement: 'DELETE FROM results LIMIT 1 OFFSET ?', 
            values: [index]
        }]);
        this.count['results'] -= 1;
    }

    async deleteAll(tableName: string) {
        await this.db.execute("DROP TABLE IF EXISTS " + tableName);
        this.count[tableName] = 0;
    }

    private async deleteOlderLogsIfThereAreTooMany() {
        var delCount = this.count['logs'] - this.disk.maxLogRows + 1;
        if (delCount > 0) {
            await this.db.executeSet([{statement: deleteSql, values: [delCount]}]);
            this.count['logs'] -= delCount;
        }
    }
}