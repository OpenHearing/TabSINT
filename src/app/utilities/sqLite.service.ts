import { Injectable } from '@angular/core';import { CapacitorSQLite, CapacitorSQLitePlugin, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';

import { NumDictionary } from '../interfaces/num-dictionary.interface';
import { DiskInterface } from '../models/disk/disk.interface';
import { AppModel } from '../models/app/app.service';
import { DiskModel } from '../models/disk/disk.service';
import { AppInterface } from '../models/app/app.interface';
import { createLogsTableSql, createResultsTableSql, deleteSql } from './constants';

@Injectable({
    providedIn: 'root',
})

export class SqLite {
    disk: DiskInterface;
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
    ) {
        this.sqlitePlugin = CapacitorSQLite;
        this.disk = this.diskModel.getDisk(); 
        this.app = this.appModel.getApp();
    }

    async init() {
        await this.initializePlugin();
        await this.initializeWeb();
        await this.open();
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
            if(jeepSqliteEl != null) {
                await this.sqliteConnection.initWebStore();
            }
        }
        return true;
    }

    private async open() {
        const database: string = 'storage1';
        this.db = await this.sqliteConnection.createConnection(database, false, 'no-encryption', 1, false);
        await this.db.open();
        await this.db.execute(createResultsTableSql);
        await this.db.execute(createLogsTableSql);
    }
    
    async store(
        tableName: string, 
        data: string
    ) {
        try {
            const sql = "INSERT INTO " + tableName + " (data) VALUES (?)";
            await this.db.run(sql, [data]);
            console.log("SQLITE " + tableName + " stored");
            this.count[tableName] += 1;
        } catch(e) {
            console.log("SQLITE Error storing " + tableName + " with error " + e);
        }
      };
  
    async getSingleResult(index: number) {
        const sql = 'SELECT data FROM results LIMIT 1 OFFSET ?';
        let res = (await this.db.query(sql, [index])).values!.map(res => res.data);
        return JSON.parse(JSON.stringify(res));
    }

    async getAllResults() {
        const sql = 'SELECT data FROM results'
        return (await this.db.query(sql)).values?.map(res => JSON.parse(res.data));
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
        } catch(e) {
            console.log("SQLITE Error deleting result " + index + " with error " + e);
        }
    }

    async deleteAll(tableName: string) {
        try {
            await this.db.run("DELETE FROM results");
            this.count[tableName] = 0;
        } catch (e) {
            console.log("SQLITE Error deleting all " + tableName + " with error: " + e);
        }
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