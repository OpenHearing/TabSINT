import * as _ from 'lodash';

import { Injectable } from '@angular/core';
import { Logger } from '../utilities/logger.service';
import { DiskModel } from '../models/disk/disk.service';
import { ProtocolModel } from '../models/protocol/protocol.service';
import { ProtocolInterface } from '../models/protocol/protocol.interface';
import { ProtocolServer} from '../utilities/constants';
import { AppModel } from '../models/app/app.service';
import { FileService } from './file.service';
import { Paths } from '../utilities/paths.service';
import { LoadingProtocolInterface } from '../interfaces/loading-object.interface';
import { DiskInterface } from '../models/disk/disk.interface';
import { AppInterface } from '../models/app/app.interface';

@Injectable({
    providedIn: 'root',
})

export class ProtocolService {
    disk: DiskInterface;
    app: AppInterface;
    loading: LoadingProtocolInterface;
    protocol: ProtocolInterface;

    constructor(
        public appModel: AppModel,
        public diskModel: DiskModel,
        public file: FileService,
        public logger:Logger,
        public paths: Paths,
        public protocolModel: ProtocolModel
    ) { 
        this.disk = this.diskModel.getDisk(); 
        this.app = this.appModel.getApp();
        this.protocol = this.protocolModel.getProtocol();
        
        this.loading = {
            protocol: undefined,
            calibration: undefined,
            validate: this.disk.validateProtocols,
            meta: undefined,
            reload: false,
            notify: false
        };
    }
    
    init(): void  {
        _.remove(this.disk.loadedProtocols, {
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
        if (!this.app.tablet) {
            // config.load();
        }
        this.disk.server = ProtocolServer.LocalServer;
    
        // add root, recursively will add all dependent schemas
        // protocolSchema = addSchema("protocol_schema");
    
        // add 'tabsint-protocols' directory next to 'tabsint-results' to store local server TabSINT protocols
        if (this.app.tablet) {
            this.file.createDirectory("tabsint-protocols");
        }
    };

    define(obj: ProtocolInterface): ProtocolInterface {

        // if (obj.server === ProtocolServer.Developer) {
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

    store(p: ProtocolInterface): void {
        const duplicates = _.filter(this.disk.loadedProtocols, {
            name: p.name,
            path: p.path,
            date: p.date,
            contentURI: p.contentURI
        });
    
        if (duplicates.length === 0) {
            this.disk.loadedProtocols.push(p);
        } else {
            this.logger.error("Protocol meta data already in this.disk.protocols");
        }
    };

    load(meta: any, validate: boolean, notify: boolean, reload: boolean) { //Promise<any> {
        this.loading.meta = meta;
        this.loading.validate = validate || this.disk.validateProtocols; // if validate is a boolean, use it, otherwise default to this.disk.validateProtocols
        this.loading.notify = notify || false;
        this.loading.reload = reload || false;
    
        if (!this.loading.meta && this.disk.activeProtocol.path) {
            this.loading.meta = this.disk.activeProtocol;
        } else if (!meta && !this.disk.activeProtocol.path) {
            this.logger.debug("No protocol available");
            //return Promise.reject();
        }
    
        // fix path
        // this.loading.meta.path = paths.dir(this.loading.meta.path);
    
        // const validateIfCalledFor = (): Promise<any> => {
        //     const deferred = $q.defer();
    
        //     if (this.loading.validate) {
        //         const validationResult = this.validate(loading.p);
        //         if (validationResult.valid) {
        //             deferred.resolve();
        //         } else {
        //             deferred.reject("Validation Errors: " + JSON.stringify(validationResult.error));
        //         }
        //     } else {
        //         deferred.resolve();
        //     }
    
        //     return deferred.promise;
        // }
    
        // function addTask(taskName: string, taskMessage: string): Promise<any> {
        //     if (loading.notify) {
        //         return tasks.register(taskName, taskMessage);
        //     } else {
        //         return Promise.resolve();
        //     }
        // }
    
        let errorCopying: Boolean = false;
        return this.logger.debug('Protocol loading in development');
        // this.file.copyDirectory(this.loading.meta!.contentURI, this.loading.meta!.name)
        // addTask("updating protocol", "Loading Protocol Files...")
            //check if we need to re-copy directory
            // .then(() => {
            //     logger.debug("loading.meta" + JSON.stringify(loading.meta));
            //     if (loading.meta.contentURI && loading.reload) {
            //         logger.debug("re-loading protocol - copying directory");
            //         return file.copyDirectory(loading.meta.contentURI, loading.meta.name);
            //     }
            // })
            //catch error
            // .catch(() => {
            //     errorCopying = true;
            // })
            //propagate error down promise chain
            // .then(() => {
            //     const promise = new Promise((resolve, reject) => void {
            //         if (errorCopying) {
            //             reject({
            //                 code: 606,
            //                 msg: "Error reloading protocol"
            //             });
            //         } else: {
            //             resolve();
            //         }
            //     });
            //     return promise;
            // })
            // .then(loadFiles) // uses loading.meta, sets loading.p, loading.c
            // .then(() => {
            //     return addTask("updating protocol", "Validating Protocol... This process could take several minutes");
            // })
            // .then(validateIfCalledFor) // uses loading.p, loading.validate
            // .then(() => {
            //     return addTask("updating protocol", "Initializing Protocol...");
            // })
            // .then(initializeProtocol) // sets loading.p to pm.root
            // .then(() => {
            //     return addTask("updating protocol", "Checking Protocol Files...");
            // })
            // .then(loadCustomJs)
            // .then(validateCustomJsIfCalledFor)
            // .then(handleLoadErrors) // uses pm.root, loading.notify
            // .catch((e: Error) => {
            //     // tasks.deregister("updating protocol");
            //     this.logger.error("Could not load protocol.  " + JSON.stringify(e));
            //     // if (e.code == 606 && meta !== undefined) {
            //     //     notifications.alert("Error reloading protocol. Please delete and re-add.");
            //     // }
            // })
            // .finally(() => {
            //     // this.tasks.deregister("updating protocol");
            //     if (errorCopying) {
            //         throw "Error loading protocol";
            //     }
            // });
    };

    delete(p: ProtocolInterface): void {
        const idx = _.findIndex(this.disk.loadedProtocols, p);
    
        if (idx === -1) {
            this.logger.error("Trying to delete protocol " + p.name + ", but it does not exist");
            return;
        }
    
        if (_.includes(["app", "developer"], p.group)) {
            this.logger.error("Trying to delete app or developer protocol " + p.name + ", but this is not allowed");
            return;
        }
    
        if (this.app.tablet && this.protocol.server === ProtocolServer.Gitlab) {
            try {
                this.logger.debug("Removing protocol files for protocol: " + p.name + " at path: " + p.path);
                const root = p.path!
                    .split("/")
                    .slice(0, -2)
                    .join("/");
                const dir = p.path!.split("/").slice(-2, -1)[0];
                this.logger.debug('Delete protocol in development');
                // this.file.removeRecursively(root, dir).catch(function(e: Error) {
                //     this.logger.error(
                //         "Failed to remove protocol files in directory " +
                //         dir +
                //         " within root " +
                //         root +
                //         " for protocol " +
                //         protocol.name +
                //         " with error: " +
                //         angular.toJson(e)
                //     );
                // });
            } catch (e) {
                this.logger.debug("Failed to remove protocol directory " + p.name + " from path " + p.path);
            }
        }
    
        this.disk.loadedProtocols.splice(idx, 1);
    
        if (this.isActive(p)) {
            this.disk.activeProtocol = {};
        }
    
        //try to erase the files copied to internal storage
        try {
            console.log("attempting to delete files in development");
            // this.file.deleteCopiedInternalDir(p.path, p.name);
        } catch (error) {
            console.log("Error trying to delete files");
            console.log(error);
        }
    };
    
    isActive(p: ProtocolInterface | undefined): Boolean {
        if (this.disk.activeProtocol && p && this.disk.activeProtocol.name == p.name && this.disk.activeProtocol.path == p.path) {
          return true;
        } else {
          return false;
        }
      };

}