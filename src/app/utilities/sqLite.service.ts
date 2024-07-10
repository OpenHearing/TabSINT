import { Injectable } from '@angular/core';import { CapacitorSQLite, CapacitorSQLitePlugin, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';

import { NumDictionary } from '../interfaces/num-dictionary.interface';
import { DevicesInterface } from '../models/devices/devices.interface';
import { DiskInterface } from '../models/disk/disk.interface';
import { AppModel } from '../models/app/app.service';
import { DiskModel } from '../models/disk/disk.service';
import { createLogsTableSql, createResultsTableSql, deleteSql } from './constants';
import { DevicesModel } from '../models/devices/devices.service';
import { getDateString } from './results-helper-functions';
import { AppInterface } from '../models/app/app.interface';
import { resolve } from 'path';

@Injectable({
    providedIn: 'root',
})

export class SqLite {
    disk: DiskInterface;   
    devices: DevicesInterface; 
    app: AppInterface;
    count: NumDictionary ={
        logs: 0,
        results: 0
    };
    sqlitePlugin!: CapacitorSQLitePlugin;
    sqliteConnection!: SQLiteConnection;
    
    private db!: SQLiteDBConnection;

    constructor (
        private appModel: AppModel,
        private diskModel: DiskModel,
        public devicesModel: DevicesModel
    ) {
        this.sqlitePlugin = CapacitorSQLite;
        this.disk = this.diskModel.getDisk(); 
        this.devices = this.devicesModel.getDevices();
        this.app = this.appModel.getApp();
        console.log("SQLITE in constructor");       
        this.init();
    }

    private async init() {
        console.log("SQLITE in init");  
        await this.initializePlugin();
        await this.initializeWeb();
        console.log("SQLITE in init 3");  
        await this.open();
        return true;
    }

    private async initializePlugin() {
        this.sqlitePlugin = CapacitorSQLite;
        this.sqliteConnection = new SQLiteConnection(this.sqlitePlugin);
        console.log("SQLITE done initializePlugin");
        return true;
    }

    private async initializeWeb() {
        console.log("SQLITE this.app.browser: " + this.app.browser);  
        if (this.app.browser === true) {
            console.log("SQLITE in init 2");  
            await customElements.whenDefined('jeep-sqlite');
            const jeepSqliteEl = document.querySelector('jeep-sqlite');
            if(jeepSqliteEl != null) {
                await this.sqliteConnection.initWebStore();
                console.log(`SQLITE >>>> isStoreOpen ${jeepSqliteEl.isStoreOpen()}`);
            } else {
                console.log('SQLITE >>>> jeepSqliteEl is null');
            }
        }
        return true;
    }

    private async open() {
        console.log("SQLITE in open");  
        const database: string = 'storage1';
        this.db = await this.sqliteConnection.createConnection(database, false, 'no-encryption', 1, false);
        console.log("SQLITE db connection created");
        await this.db.open();
        console.log("SQLITE db opened");
        await this.db.execute(createResultsTableSql);
        console.log("SQLITE results table created");
        await this.db.execute(createLogsTableSql);
        console.log("SQLITE logs table created");
        return true;
    }
    
    async store(
        tableName: string, 
        data: string
    ) {
        try {
            await this.db.executeSet([{ 
                statement: "INSERT INTO " + tableName + 
                    " (data) VALUES (?)",
                values: [getDateString(), 
                    data]
                }]
            );

            console.log("SQLITE " + tableName + " stored");

            this.count[tableName] += 1;
        } catch(e) {
            console.log("SQLITE Error storing " + tableName + " with error " + e);
        }
      };
  
    async getSingleResult(index: number) {
            let temp = (await this.db.query('SELECT data FROM results LIMIT 1 OFFSET ?', [index])).values;
            console.log("SQLITE getSingleResult: " + temp);
            return temp;
    }

    async getAll(tableName: string) {
            return (await this.db.query('SELECT data FROM ' + tableName + ';')).values;
    }

    async deleteSingleResult(index: number) {
        try {
            await this.db.executeSet([{
                statement: 'DELETE FROM results LIMIT 1 OFFSET ?', 
                values: [index]
            }]);
            this.count['results'] -= 1;
        } catch(e) {
            console.log("SQLITE Error deleting result " + index + " with error " + e);
        }
    }

    async deleteAll(tableName: string) {
            await this.db.execute("DROP TABLE IF EXISTS " + tableName);
            this.count[tableName] = 0;
    }

    async deleteOlderLogsIfThereAreTooMany() {
            var delCount = this.count['logs'] - this.disk.maxLogRows + 1;
            if (delCount > 0) {
                try {
                    await this.db.executeSet([{statement: deleteSql, values: [delCount]}]);
                } catch(e) {
                    console.log("SQLITE Error deleting " + delCount + " logs with error " + e);
                }
                this.count['logs'] -= delCount;
            }
    }
}