import * as _ from 'lodash';
import { Injectable } from '@angular/core';
import { CopyResult } from '@capacitor/filesystem';
import { TranslateService } from '@ngx-translate/core';

import { ProtocolSchema } from '../interfaces/protocol-schema.interface';
import { LoadingProtocolInterface } from '../interfaces/loading-protocol-object.interface';
import { ProtocolValidationResultInterface } from '../interfaces/protocol-validation-result.interface';
import { ProtocolErrorInterface } from '../interfaces/protocol-error.interface';
import { DiskModel } from '../models/disk/disk.service';
import { DiskInterface } from '../models/disk/disk.interface';
import { ProtocolModel } from '../models/protocol/protocol.service';
import { ProtocolInterface } from '../models/protocol/protocol.interface';
import { AppModel } from '../models/app/app.service';
import { AppInterface } from '../models/app/app.interface';
import { ProtocolModelInterface } from '../models/protocol/protocol-model.interface';
import { DialogType, ProtocolServer} from '../utilities/constants';
import { Logger } from '../utilities/logger.service';
import { FileService } from './file.service';
import { Paths } from '../utilities/paths.service';
import { Tasks } from '../utilities/tasks.service';
import { Notifications } from '../utilities/notifications.service';
import { loadingProtocolDefaults } from '../utilities/defaults';
import { processProtocol } from '../utilities/process-protocol';
import { checkCalibrationFiles, checkControllers, checkPreProcessFunctions } from '../utilities/protocol-checks';

@Injectable({
    providedIn: 'root',
})

export class ProtocolService {
    disk: DiskInterface;
    app: AppInterface;
    loading: LoadingProtocolInterface;
    protocolModel: ProtocolModelInterface;

    constructor(
        public appModel: AppModel,
        public diskModel: DiskModel,
        public file: FileService,
        public logger:Logger,
        public paths: Paths,
        public protocolM: ProtocolModel,
        public tasks: Tasks,
        public translate: TranslateService,
        public notifications: Notifications
    ) { 
        this.disk = this.diskModel.getDisk(); 
        this.app = this.appModel.getApp();
        this.protocolModel = this.protocolM.getProtocolModel();
        
        this.loading = loadingProtocolDefaults(this.disk.validateProtocols);
    }

    init(): void  {
    
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
    
        // put the protocols on the this.protocols.activeProtocol object
        // _.forEach(localProtocols, (p) => {
        //     this.store(p);
        // });
    
        // define plugin protocols, and store on disk
        // _.forEach(plugins.elems.localProtocols, function(p) {
        //     store(define(p));
        // });
    
        // select the source to start
        // if (!this.app.tablet) {
            // config.load();
        // }
        // this.disk.server = ProtocolServer.LocalServer;
    
        // add root, recursively will add all dependent schemas
        // protocolSchema = addSchema("protocol_schema");
    
        // add 'tabsint-protocols' directory next to 'tabsint-results' to store local server TabSINT protocols
        // if (this.app.tablet) {
        //     this.file.createDirectory("tabsint-protocols");
        // }
    };

    store(p: ProtocolInterface): void {
        const duplicates = _.filter(this.protocolModel.loadedProtocols, {
            name: p.name,
            path: p.path,
            date: p.date,
            contentURI: p.contentURI
        });
    
        if (duplicates.length === 0) {
            this.protocolModel.loadedProtocols.push(p);
        } else {
            this.logger.error("Protocol meta data already in this.protocolModel");
        }
    };

    load(meta: any, _requiresValidation: boolean, notify: boolean, reload: boolean) { //Promise<any> {
        this.loading.meta = meta;
        this.loading.requiresValidation = _requiresValidation || this.disk.validateProtocols;
        this.loading.notify = notify || false;
        this.loading.reload = reload || false;
    
        if (!this.loading.meta && this.protocolModel.activeProtocol && this.protocolModel.activeProtocol.path) {
            this.loading.meta = this.protocolModel.activeProtocol;
        } else if (!meta && this.protocolModel.activeProtocol && !this.protocolModel.activeProtocol.path) {
            this.logger.debug("No protocol available");
            //return Promise.reject();
        }
    
        // fix path
        // this.loading.meta.path = paths.dir(this.loading.meta.path);
    
        const addTask = (taskName: string, taskMessage: string): Promise<void> => {
            return new Promise((resolve) => {
                if (this.loading.notify) {
                    this.tasks.register(taskName, taskMessage);
                    resolve();
                } else {
                    resolve();
                }
            });
        }

        const reloadIfNeeded = (): Promise<CopyResult | void> => {
            return new Promise((resolve) => {
                this.logger.debug("loading.meta" + JSON.stringify(this.loading.meta));
                if (this.loading.meta.contentURI && this.loading.reload) {
                    this.logger.debug("re-loading protocol - copying directory");
                    resolve(this.file.copyDirectory(this.loading.meta.contentURI, this.loading.meta.name!));
                } else {
                    resolve();
                }
            });
        }
    
        const loadFiles = () => {
            // callbackQueue.clear();
      
            this.loading = loadingProtocolDefaults(this.disk.validateProtocols);;
            this.loading.calibration = undefined;
            return this.file.readFile(this.loading.meta.path + "protocol.json")
              .then((res) => {
                const promise = new Promise<void>((resolve, reject) => {
                    if (res) {
                        this.loading.protocol = res as unknown as ProtocolInterface; // ????
                        resolve();
                    } else {
                        reject()
                    }
                    
                });
                return promise;
              })
              .then(() => {
                return this.file.readFile(this.loading.meta.path + "calibration.json");
              })
              .then((res) => {
                const promise = new Promise<void>((resolve, reject) => {
                    this.loading.calibration = res;
                    resolve();
                });
                return promise;
              })
              .then(() => {
                const promise = new Promise<void>((resolve, reject) => {
                    if (!this.loading.protocol) {
                      this.logger.error("Protocol did not load properly");
                      if (this.disk.audhere) {
                        this.notifications.alert(
                          this.translate.instant("The protocol specified is not available, please see the administrator.")
                        );
                      } else {
                        this.notifications.alert(
                          this.translate.instant(
                            "Protocol did not load properly. Please validate your protocol before trying to load again."
                          )
                        );
                      }
                      reject("Failed to load protocol file");
                    } else {
                      resolve();
                    }
                })
                return promise;
              })
              .catch((err) => {
                this.logger.error("Error while loading files: " + err);
              });
          }
          
        const validate = (p: ProtocolSchema): Promise<ProtocolValidationResultInterface> => {
            return new Promise((resolve) => {
                let ret: ProtocolValidationResultInterface = {
                    valid: true,
                    error: {}
                };
                console.log('temp validate ' + p.protocolId + ' function for development');
                resolve(ret);
            });
        }

        const validateIfCalledFor = (): Promise<void> => {
            return new Promise((resolve, reject) => {
                if (this.loading.requiresValidation) {
                    validate(this.loading.protocol)
                        .then(validationResult => {
                            if (validationResult.valid) {
                                resolve();
                            } else {
                                reject("Validation Errors: " + JSON.stringify(validationResult.error));
                            }
                        })
                        .catch(error => {
                            this.logger.error("validateIfCalledFor failed with error: " + error);
                        })
                } else {
                    resolve();
                }
            });
        }
    

      
        const initializeProtocol = () => {
            this.tasks.register("updating protocol", "Processing Protocol...");
            
            this.loading.protocol.errors = [];
            var cCommon, msg;
    
            if (this.disk.requireEncryptedResults && !this.loading.protocol.publicKey) {
                this.loading.protocol.errors.push({
                    type: this.translate.instant("Public Key"),
                    error: this.translate.instant(
                        'No public encryption key is defined in the protocol. Results will not be recorded from this protocol while the "Require Encryption" setting is enabled.'
                    )
                });
            }
    
            this.loading.protocol.protocolTabsintOutdated = false;
            if (this.loading.protocol.minTabsintVersion) {
                var mtv = _.map(this.loading.protocol.minTabsintVersion.split("."), function(s) {
                    return parseInt(s);
                }); //
                // var ctv = _.map(version.dm.tabsint.split("-")[0].split("."), function(s) {
                //     return parseInt(s);
                // });
        
                if ( false
                    // mtv[0] < ctv[0] ||
                    // (mtv[0] === ctv[0] && mtv[1] < ctv[1]) ||
                    // (mtv[0] === ctv[0] && mtv[1] === ctv[1] && mtv[2] <= ctv[2])
                ) {
                    this.logger.debug(
                    "Tabsint version " +
                        // version.dm.tabsint +
                        ", Protocol requires tabsint version " +
                        this.loading.protocol.minTabsintVersion
                    );
                } else {
                    msg =
                        this.translate.instant("Protocol requires tabsint version ") +
                        this.loading.protocol.minTabsintVersion +
                        this.translate.instant(", but current Tabsint version is ")
                    // version.dm.tabsint;
                    this.logger.error(msg);
                    this.loading.protocol.errors.push({
                        type: this.translate.instant("TabSINT Version"),
                        error: msg
                    });
                    this.loading.protocol.protocolTabsintOutdated = true;
                }
            }
    
            // confirm EPHD1 is connected when headset is EPHD1
            this.loading.protocol.protocolUsbCMissing = false; // default/reset to false.
            if (this.loading.protocol.headset === "EPHD1") {
                // this.loading.protocol.protocolUsbCMissing = !tabsintNative.isUsbConnected;
                console.log("About to run registerUsbDeviceListener()");
            // tabsintNative.registerUsbDeviceListener(api.usbEventCallback);
            } else {
            // tabsintNative.unregisterUsbDeviceListener(api.usbEventCallback);
            }
    
            var reqCalProperties = [
                "headset",
                "tablet",
                "audioProfileVersion",
                "calibrationPySVNRevision",
                "calibrationPyManualReleaseDate"
            ];
            if (_.difference(_.keys(this.loading.calibration), reqCalProperties).length > 0) {
            // if calibration contains wav files
            if (_.intersection(_.keys(this.loading.calibration), reqCalProperties).length === reqCalProperties.length) {
                // if calibration contains all the required properties
                this.loading.protocol.headset = this.loading.calibration.headset;
                this.loading.protocol._audioProfileVersion = this.loading.calibration.audioProfileVersion;
                this.loading.protocol._calibrationPySVNRevision = this.loading.calibration.calibrationPySVNRevision;
                this.loading.protocol._calibrationPyManualReleaseDate = this.loading.calibration.calibrationPyManualReleaseDate;
            } else {
                this.loading.protocol._audioProfileVersion = "none";
                this.loading.protocol._calibrationPySVNRevision = "none";
                this.loading.protocol._calibrationPyManualReleaseDate = "none";
                msg = "The loaded protocol calibration file is missing version fields.";
                this.logger.error(msg);
                this.loading.protocol.errors.push({
                type: "Calibration",
                error: msg
                });
            }
            }
            this.loading.protocol.currentCalibration = this.loading.protocol.headset || "None"; 
    
            if (this.loading.protocol.commonMediaRepository) {
            var midx = _.findIndex(this.disk.mediaRepos, {
                name: this.loading.protocol.commonMediaRepository
            });
            if (midx !== -1) {
                this.loading.protocol.commonRepo = this.disk.mediaRepos[midx];
                // cCommon = json.load(loading.protocol.commonRepo.path + "calibration.json");
            } else {
                msg =
                "The media repository referenced by this protocol is not available (" +
                this.loading.protocol.commonMediaRepository +
                "). " +
                "Please try updating this protocol to automatically download the media repository";
                this.logger.error("media repository referenced by protocol is not available: " + this.loading.protocol.commonMediaRepository);
                this.loading.protocol.errors.push({
                type: "Media",
                error: msg
                });
            }
            }
    
            this.loading.protocol._exportCSV = false;
            this.loading.protocol._protocolIdDict = {};
            this.loading.protocol._preProcessFunctionList = [];
            this.loading.protocol._missingPreProcessFunctionList = [];
            this.loading.protocol._missingControllerList = [];
            this.loading.protocol._customHtmlList = [];
            this.loading.protocol._missingHtmlList = [];
            this.loading.protocol._missingWavCalList = [];
            this.loading.protocol._missingCommonWavCalList = [];
            this.loading.protocol._requiresCha = false;
            this.loading.protocol.errors = [];
    
            processProtocol(this.loading.protocol, this.loading.protocol._protocolIdDict, this.loading.protocol, this.loading.calibration, cCommon, this.loading.meta.path!);
            // put the processed protocol on the protocol model, root object
            this.protocolModel.activeProtocol = this.loading.protocol;
    
            if (this.protocolModel.activeProtocol && "key" in this.protocolModel.activeProtocol) {
                if (this.protocolModel.activeProtocol.key !== undefined) {
                    this.protocolModel.activeProtocol.publicKey = decodeURI(this.protocolModel.activeProtocol.key);
                }
            }
            this.protocolModel.activeProtocol = this.loading.protocol;
            this.disk.headset = this.protocolModel.activeProtocol.headset || "None";
    
            // try connecting the cha
            if (this.loading.protocol._requiresCha) {
                this.logger.debug("This exam requires the CHA, attempting to connect...");
            // setTimeout(cha.connect, 1000);
            }
    
            // call each function from the callbackQueue
            // callbackQueue.run();
        }

        const handleLoadErrors = () => {
            let msg = checkCalibrationFiles(this.protocolModel.activeProtocol!);
            if (typeof msg === "string") {
                this.logger.debug(msg);
                this.protocolModel.activeProtocol!.errors!.push({
                    type: "Calibration",
                    error: msg
                });
            } else {
                this.logger.debug("All calibration files found.");
            }
        
            checkPreProcessFunctions(this.protocolModel.activeProtocol!).forEach((e: ProtocolErrorInterface) => {
                this.protocolModel.activeProtocol!.errors!.push(e);
            })
            
            checkControllers(this.protocolModel.activeProtocol!).forEach((e: ProtocolErrorInterface) => {
                this.protocolModel.activeProtocol!.errors!.push(e);
            })
          
            if (this.protocolModel.activeProtocol!.errors!.length > 0) {
                msg ="The protocol contains the following errors and may not function properly." + " \n\n";
                for (var i = 0; i < this.protocolModel.activeProtocol!.errors!.length; i++) {
                    var err = this.protocolModel.activeProtocol!.errors![i];
                    msg += err.type + ":\n";
                    msg += " - " + err.error + "\n";
                }
                this.logger.error(" Protocol contains the following errors: " + JSON.stringify(this.protocolModel.activeProtocol!.errors));
                this.notifications.alert({
                    title: "Alert",
                    content: msg,
                    type: DialogType.Alert
                });
            } else if (this.loading.notify) {
                msg = "Successfully loaded protocol: " +
                    this.loading.meta.name +
                    "\nThis protocol requires headset: " + this.protocolModel.activeProtocol!.headset;
                this.notifications.alert({
                    title: "Alert",
                    content: msg,
                    type: DialogType.Alert
                });
            }
            this.tasks.deregister("updating protocol");
        }

        let errorCopying: Boolean = false;
        return addTask("updating protocol", "Loading Protocol Files...")
            .then(reloadIfNeeded)
            .catch(() => {
                errorCopying = true;
            })
            .then(() => {
                const promise = new Promise<void>((resolve, reject) => {
                    if (errorCopying) {
                        reject({
                            code: 606,
                            msg: "Error reloading protocol"
                        });
                    } else {
                        resolve();
                    }
                });
                return promise;
            })
            .then(loadFiles)
            .then(() => {
                return addTask("updating protocol", "Validating Protocol... This process could take several minutes");
            })
            .then(validateIfCalledFor)
            .then(() => {
                return addTask("updating protocol", "Initializing Protocol...");
            })
            .then(initializeProtocol)
            .then(() => {
                return addTask("updating protocol", "Checking Protocol Files...");
            })
            // .then(loadCustomJs)
            // .then(validateCustomJsIfCalledFor)
            .then(handleLoadErrors) // uses this.protocolModel.activeProtocol, loading.notify
            .catch((e: Error) => {
                // tasks.deregister("updating protocol");
                this.logger.error("Could not load protocol.  " + JSON.stringify(e));
                // if (e.code == 606 && meta !== undefined) {
                //     notifications.alert("Error reloading protocol. Please delete and re-add.");
                // }
            })
            .finally(() => {
                // this.tasks.deregister("updating protocol");
                if (errorCopying) {
                    throw "Error loading protocol";
                }
            });
    };

    delete(p: ProtocolInterface): void {
        const idx = _.findIndex(this.protocolModel.loadedProtocols, p);
    
        if (idx === -1) {
            this.logger.error("Trying to delete protocol " + p.name + ", but it does not exist");
            return;
        }
    
        if (_.includes(["app", "developer"], p.group)) {
            this.logger.error("Trying to delete app or developer protocol " + p.name + ", but this is not allowed");
            return;
        }
    
        if (this.app.tablet && p.server === ProtocolServer.Gitlab) {
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
                //         JSON.stringify(e)
                //     );
                // });
            } catch (e) {
                this.logger.debug("Failed to remove protocol directory " + p.name + " from path " + p.path);
            }
        }
    
        this.protocolModel.loadedProtocols.splice(idx, 1);
    
        if (this.isActive(p)) {
            this.protocolModel.activeProtocol = undefined;
        }
    
        try {
            console.log("attempting to delete files in development");
            // this.file.deleteCopiedInternalDir(p.path, p.name);
        } catch (error) {
            console.log("Error trying to delete files");
            console.log(error);
        }
    };
    
    isActive(p: ProtocolInterface | undefined): Boolean {
        if (this.protocolModel.activeProtocol && p && this.protocolModel.activeProtocol.name == p.name && this.protocolModel.activeProtocol.path == p.path) {
          return true;
        } else {
          return false;
        }
      };

}