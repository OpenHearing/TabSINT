import { Injectable } from '@angular/core';
import sqlite from 'sqlite'
import { AppModel } from '../models/app/app.service';
import { DevicesInterface } from '../models/devices/devices.interface';
import { DiskModel } from '../models/disk/disk.service';
import { DiskInterface } from '../models/disk/disk.interface';
import { Logger } from './logger.service';
import { NumDictionary } from '../interfaces/num-dictionary.interface';
// import { open } from 'sqlite'

@Injectable({
    providedIn: 'root',
})

export class SqLite {
    db!: sqlite.Database;
    disk: DiskInterface;    
    count: NumDictionary ={
        logs: 0,
        results: 0
    };

    constructor (
        private app: AppModel,
        private diskModel: DiskModel,
        private logger: Logger
    ) {
        this.open().then((db) => {
            this.db = db;
        });
        this.disk = this.diskModel.getDisk();
    }

    async open() {
        return await sqlite.open({
            filename: '/test.db',
            driver: sqlite.Database
        });
    }

    async store(
        tableName: string, 
        date: string, 
        type: string, 
        data: string, 
        param: DevicesInterface
    ) {
        await this.db.exec(
            "CREATE TABLE IF NOT EXISTS " +
            tableName +
            " (msgID INTEGER PRIMARY KEY AUTOINCREMENT, date TEXT, data TEXT, type TEXT, uuid TEXT, siteID TEXT, build TEXT, version TEXT, platform TEXT, model TEXT, os TEXT, other TEXT)"
        );

        if (tableName === "logs") {
            var delCount = this.count['logs'] - this.disk.maxLogRows + 1;
            if (delCount > 0) {
            await this.db.run(
                "DELETE FROM logs WHERE logs.msgID IN (SELECT msgID FROM logs ORDER BY date LIMIT ?);",
                delCount
            );
            this.count['logs'] -= delCount;
            }
        }

        await this.db.run(
            "INSERT INTO " +
            tableName +
            " (date, data, type, uuid, siteID, build, version, platform, model, os, other) VALUES (?,?,?,?,?,?,?,?,?,?,?)",
            [
            date,
            data,
            type,
            param.uuid,
            param.protocolId,
            param.build,
            param.version,
            param.platform,
            param.model,
            param.os,
            param.other
            ],
            null,
            null
        );

        this.count[tableName] += 1;

      };
  
    async getSingleResult(index: number) {
        return await this.db.get('SELECT * FROM results LIMIT 1 OFFSET ?', index);
    }

    async deleteSingleResult(index: number) {
        await this.db.run('DELETE FROM results LIMIT 1 OFFSET ?', index);
        this.count['results'] -= 1;
    }

    async deleteAll(tableName: string) {
        await this.db.run("DROP TABLE IF EXISTS " + tableName);
        this.count[tableName] = 0;
    }
}