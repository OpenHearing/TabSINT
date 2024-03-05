import * as _ from 'lodash';

import { Injectable } from '@angular/core';
import { Logger } from '../utilities/logger.service';
import { DiskM } from '../models/disk/disk.service';
import { ProtocolM } from '../models/protocol/protocol.service';
import { ProtocolModel } from '../models/protocol/protocol.interface';
import { ProtocolServer, Server } from '../utilities/constants';
import { AppM } from '../models/app/app.service';
import { FileService } from './file.service';
import { Paths } from '../utilities/paths.service';

@Injectable({
    providedIn: 'root',
})

export class Protocol {

    constructor(
        public appM: AppM,
        public diskM: DiskM,
        public file: FileService,
        public logger:Logger,
        public paths: Paths,
        public protocolM: ProtocolM
    ) {  }
    
    init(): void  {
        _.remove(this.diskM.diskM.loadedProtocols, {
                server: ProtocolServer.Developer
        });
    
        let localProtocols = [
            this.define({
                name: "Audiometry",
                path: this.paths.www("res/protocol/edare-audiometry"),
                creator: "Edare",
                server: ProtocolServer.Developer
            }),
            this.define({
                name: "Creare Audiometry",
                path: this.paths.www("res/protocol/creare-audiometry"),
                creator: "creare",
                server: ProtocolServer.Developer,
                admin: true
            }),
            this.define({
                name: "tabsint-test",
                path: this.paths.www("res/protocol/TabSINT-Test"),
                creator: "creare",
                server: ProtocolServer.Developer,
                admin: true
            }),
            this.define({
                name: "wahts-device-test",
                path: this.paths.www("res/protocol/wahts-device-test"),
                creator: "creare",
                server: ProtocolServer.Developer,
                admin: true
            }),
            this.define({
                name: "wahts-software-test",
                path: this.paths.www("res/protocol/wahts-software-test"),
                creator: "creare",
                server: ProtocolServer.Developer,
                admin: true
            })
        ];
    
        // load each protocol in config
        // if (app.browser && config.protocols && config.protocols.length > 0) {
        //     _.forEach(config.protocols, function(p) {
        //         pm.local.push(
        //             define({
        //                 name: p,
        //                 path: paths.www("protocols/" + paths.dir(p)),
        //                 creator: "creare",
        //                 server: "developer",
        //                 admin: true
        //             })
        //         );
        //     });
        // }
    
        // put the protocols on the disk.protocol object
        _.forEach(localProtocols, (p) => {
            this.store(p);
        });
    
        // define plugin protocols, and store on disk
        // _.forEach(plugins.elems.localProtocols, function(p) {
        //     store(define(p));
        // });
    
        // select the source to start
        if (!this.appM.appM.tablet) {
            // config.load();
        }
        this.diskM.diskM.server = Server.Local;
    
        // add root, recursively will add all dependent schemas
        // protocolSchema = addSchema("protocol_schema");
    
        // add 'tabsint-protocols' directory next to 'tabsint-results' to store local server TabSINT protocols
        if (this.appM.appM.tablet) {
            this.file.createDirectory("tabsint-protocols");
        }
    };

    define(obj: ProtocolModel): ProtocolModel {

        // if (obj.server === "developer") {
        //     obj.version = version.dm.tabsint;
        // }
    
        return _.defaults(
            {
                group: obj.group || null,
                name: obj.name,
                path: obj.path,
                id: obj.id || null,
                date: obj.date || null,
                version: obj.version || null,
                creator: obj.creator || null,
                server: obj.server || null,
                admin: obj.admin || false,
                contentURI: obj.contentURI || null
            },
            obj
        );
    };

    store(p: ProtocolModel): void {
        const duplicates = _.filter(this.diskM.diskM.loadedProtocols, {
            name: p.name,
            path: p.path,
            date: p.date,
            contentURI: p.contentURI
        });
    
        if (duplicates.length === 0) {
            this.diskM.diskM.loadedProtocols.push(p);
        } else {
            this.logger.error("Protocol meta data already in disk.protocols");
        }
    };
    
    isActive(p: ProtocolModel | undefined) {
        if (this.diskM.diskM.activeProtocol && p && this.diskM.diskM.activeProtocol.name == p.name && this.diskM.diskM.activeProtocol.path == p.path) {
          return true;
        } else {
          return false;
        }
      };

}