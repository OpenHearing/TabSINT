import { Injectable } from '@angular/core';
import { FileService } from '../controllers/file.service';
import { from, map, of, mergeMap } from 'rxjs';

@Injectable({
    providedIn: 'root',
})

export class VersionService {

    version:any = {
        "dm": {
            "date": "2024-01-31T16:13:53.769Z",
            "tabsint": "?"
        }
    };

    constructor(public fileService: FileService) {
        let v:Object = {
            "tabsint": "4.7.0",
            "date": "2024-01-31T16:13:53.769Z",
            "rev": "v4.6.0-119-gfee19e2f",
            "version_code": "289",
            "deps": {
              "user_agent": "npm/6.14.17 node/v14.20.1 linux x64",
              "node": "14.20.1",
              "cordova": "^9.0.0"
            },
            "plugins": [
              "",
              "> tabsint@4.7.0 cordova /home/bayotte/projects/tabsint/tabsint\n> cordova "
            ]
        };

        fileService.writeFile('version.json',JSON.stringify(v),'Data').then( (res)=> {
            fileService.readFile('version.json', 'Data').then( (res)=> {
                this.version.dm = JSON.parse(JSON.parse(JSON.stringify(res?.data)));
            })
        });
    }

    getVersion(): any {
        return this.version;
    }

    
    
}