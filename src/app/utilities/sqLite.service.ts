import { Injectable } from '@angular/core';import { CapacitorSQLite, SQLiteDBConnection } from '@capacitor-community/sqlite';

import { DevicesInterface } from '../models/devices/devices.interface';
import { DiskInterface } from '../models/disk/disk.interface';
import { NumDictionary } from '../interfaces/num-dictionary.interface';
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
    
    private sqlite: any;
    private db!: SQLiteDBConnection;

    constructor (
        private app: AppModel,
        private diskModel: DiskModel,
        private logger: Logger
    ) {
        this.sqlite = CapacitorSQLite;
        this.disk = this.diskModel.getDisk();
        this.init();
    }

    async init() {
        const database: string = "storage";
        const db = await this.sqlite.createConnection('storage', true);
        await db.open();
        this.db = db;
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
    
    // private async open() {
    //     const database: string = "storage";
    //     const encrypted:boolean = true;
    //     try {
    //       await this.db.openStore({database,encrypted});
    //       return Promise.resolve();
    //     } catch (err) {
    //       return Promise.reject(err);
    //     }      
    // }

    private async deleteOlderLogsIfThereAreTooMany() {
        var delCount = this.count['logs'] - this.disk.maxLogRows + 1;
        if (delCount > 0) {
            await this.db.executeSet([{statement: deleteSql, values: [delCount]}]);
            this.count['logs'] -= delCount;
        }
    }
}