import * as _ from 'lodash';
import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

import { FileService } from '../utilities/file.service';

import { LoadingProtocolInterface } from '../interfaces/loading-protocol-object.interface';
import { ProtocolValidationResultInterface } from '../interfaces/protocol-validation-result.interface';
import { ProtocolErrorInterface } from '../interfaces/protocol-error.interface';

import { DiskModel } from '../models/disk/disk.service';
import { ProtocolModel } from '../models/protocol/protocol-model.service';
import { ProtocolInterface } from '../models/protocol/protocol.interface';
import { AppModel } from '../models/app/app.service';
import { AppInterface } from '../models/app/app.interface';
import { ProtocolModelInterface } from '../models/protocol/protocol.interface';
import { StateInterface } from '../models/state/state.interface';
import { StateModel } from '../models/state/state.service';
import { PageModel } from '../models/page/page.service';
import { ProtocolMetaInterface } from '../models/protocol/protocol.interface';

import { ExamState } from '../utilities/constants';
import { DeveloperProtocols, DeveloperProtocolsCalibration, DialogType, ProtocolServer} from '../utilities/constants';
import { Logger } from '../utilities/logger.service';
import { Paths } from '../utilities/paths.service';
import { Tasks } from '../utilities/tasks.service';
import { Notifications } from '../utilities/notifications.service';
import { loadingProtocolDefaults } from '../utilities/defaults';
import { checkCalibrationFiles, checkControllers, checkPreProcessFunctions } from '../utilities/protocol-checks.function';
import { processProtocol } from '../utilities/process-protocol.function';
import { initializeLoadingProtocol } from '../utilities/initialize-loading-protocol';

@Injectable({
    providedIn: 'root',
})

export class ProtocolService {
    app: AppInterface;
    loading: LoadingProtocolInterface;
    protocolModel: ProtocolModelInterface;
    state: StateInterface;

    constructor(
        public appModel: AppModel,
        public diskModel: DiskModel,
        public pageModel: PageModel,
        public fileService: FileService,
        public logger:Logger,
        public paths: Paths,
        public protocolM: ProtocolModel,
        public tasks: Tasks,
        public translate: TranslateService,
        public notifications: Notifications,
        public stateModel: StateModel
    ) { 
        this.app = this.appModel.getApp();
        this.protocolModel = this.protocolM.getProtocolModel();
        this.state = this.stateModel.getState();
        
        this.loading = loadingProtocolDefaults(this.diskModel.disk.validateProtocols);

        // For BAyotte development only, auto load protocol when tabsint loads
        this.load(this.protocolModel.loadedProtocols["develop"], true, false)
    }

    /** Load all protocol files onto the protocolModel.activeProtocol object.
     * @summary Overwrite local protocol files if they have changed, load files into tabsint 
     * including custom protocol files, validate the protocol against the schema. 
     * Handle load errors.
     * @models protocol, disk
     * @param meta meta data for the protocol to load, 
     * @param notify whether to use task banners to notify user about progress. Default: false.
     * @param overwrite whether to overwrite local protocol files if they have changed. Default: false.
    */
    async load(
        meta: ProtocolMetaInterface, 
        notify: boolean = false, 
        overwrite: boolean = false
    ) {
        this.loading.meta = meta;
        this.loading.requiresValidation = this.diskModel.disk.validateProtocols;
        this.loading.notify = notify;
        this.loading.overwrite = overwrite;
        
        try {
            await this.overwriteLocalFilesIfNeeded();
            await this.loadFiles();
            this.setCalibration();
            await this.validateIfCalledFor();
            this.initializeProtocol();
                // .then(loadCustomJs)
                // .then(validateCustomJsIfCalledFor)
            this.handleLoadErrors();
        } catch(e) {
            this.tasks.deregister("updating protocol");
            this.logger.error("Could not load protocol.  " + JSON.stringify(e));
            this.notifications.alert({
                title: "Alert",
                content: "Could not load protocol.",
                type: DialogType.Alert
            }).subscribe();
        }
    };

    /**
     * Removes a protocol from TabSINT
     * @summary Check if the protocol to delete exists or is an admin or developer protocol.
     * Removes it from the protocolmodel
     * @models protocol, app
     * @param p protocol to delete
     */
    delete(p: ProtocolInterface): void {
        if (_.includes(["app", "developer"], p.group)) {
            this.logger.error("Trying to delete app or developer protocol " + p.name + ", but this is not allowed");
            return;
        }
    
        try {
            delete this.protocolModel.loadedProtocols[p.name];
            this.fileService.deleteDirectory(p.path);
        } catch (error) {
            console.log("Error trying to delete files");
            console.log(error);
        }
    };
    
    private async overwriteLocalFilesIfNeeded() {
        try {
            if (this.loading.notify) {
                this.tasks.register("updating protocol", "Loading Protocol Files...");
            }
            this.logger.debug("loading.meta" + JSON.stringify(this.loading.meta));
            if (this.loading.meta.contentURI && this.loading.overwrite) {
                this.logger.debug("re-loading protocol - copying directory");
                return
                // return (this.fileService.copyDirectory(this.loading.meta.contentURI, this.loading.meta.name!, 'Documents', 'Documents'));
            } else {
                return;
            }
        } catch(err) {
            this.logger.debug("Error overwriting: " + err);
            return {
                code: 606,
                msg: "Error overwriting protocol"
            }
        }
    }

    private async loadFiles() {

        try {
            var protocol;
            // (this.loading.meta.server === ProtocolServer.Developer)
            //     ? protocol = DeveloperProtocols[this.loading.meta.name!]
            //     : protocol = await this.fileService.readFile(this.loading.meta.contentURI).then(res=>res?.content);
            if (this.loading.meta.server==ProtocolServer.Developer){
                protocol = DeveloperProtocols[this.loading.meta.name!]
            } else {
                const response = await this.fileService.readFile(this.loading.meta.contentURI)
                protocol = response?.contentUri
            }
            if (!_.isUndefined(protocol)) {
                this.loading.protocol = {...this.loading.meta, ...protocol as unknown as ProtocolInterface};
            } else {
                this.notifyProtocolDidntLoadProperly();
            }

        } catch(err) {
            this.logger.error("Error while loading files: " + err);
        }
    }

    private async validate() {
        let ret: ProtocolValidationResultInterface = {
            valid: true,
            error: {}
        };
        console.log('temp validate ' + this.loading.protocol.protocolId + ' function for development');
        return ret;
    }

    private async validateIfCalledFor() {            
        if (this.loading.notify) {
            this.tasks.register("updating protocol", "Validating Protocol... This process could take several minutes");
        }

        if (this.loading.requiresValidation) {
            let validationResult = await this.validate();                
            if (validationResult.valid) {
                return;
            } else {
                let error = ("Validation Errors: " + JSON.stringify(validationResult.error));
                this.logger.error("validateIfCalledFor failed with error: " + error);
                return error;
            }
        } else {
            return;
        }
    } 
  
    private handleLoadErrors() {
        this.tasks.register("updating protocol", "Checking Protocol Files...");
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
            }).subscribe();
        } else if (this.loading.notify) {
            msg = "Successfully loaded protocol: " +
                this.loading.meta.name +
                "<br/>This protocol requires headset: " + this.protocolModel.activeProtocol!.headset;
            this.notifications.alert({
                title: "Alert",
                content: msg,
                type: DialogType.Alert
            }).subscribe();
        }
        this.tasks.deregister("updating protocol");
    }
    
    private initializeProtocol() {
        this.tasks.register("updating protocol", "Initializing Protocol...");
        this.loading = initializeLoadingProtocol(
            this.loading,
            this.logger,
            this.translate,
            this.diskModel,
            this.fileService);
        this.tasks.register("updating protocol", "Processing Protocol...");
        
        [this.protocolModel.activeProtocol, 
            this.protocolModel.activeProtocolDictionary,
            this.protocolModel.activeProtocolFollowOnsDictionary
        ] = processProtocol(this.loading);
            
        if (this.protocolModel.activeProtocol && "key" in this.protocolModel.activeProtocol) {
            if (this.protocolModel.activeProtocol.key !== undefined) {
                this.protocolModel.activeProtocol.publicKey = decodeURI(this.protocolModel.activeProtocol.key);
            }
        }
        
        this.diskModel.disk.headset = this.protocolModel.activeProtocol.headset || "None";
    
        if (this.loading.protocol._requiresCha) {
            this.logger.debug("This exam requires the CHA, attempting to connect...");
        // setTimeout(cha.connect, 1000);
        }    

        this.state.examIndex = 0;
        this.state.examState = ExamState.Ready;
    }

    private async setCalibration() {
        this.loading.calibration = undefined;
        var calibration;
        if (this.loading.meta.server === ProtocolServer.Developer) {
            calibration = DeveloperProtocolsCalibration[this.loading.meta.name!];
        } else {
            calibration = await this.fileService.readFile(this.loading.meta.path + "/calibration.json");
        }
        if (calibration) {
            this.loading.calibration = calibration as unknown as ProtocolInterface;
        }    
        
    }

    private notifyProtocolDidntLoadProperly() {
        this.logger.error("Protocol did not load properly");
        if (this.diskModel.disk.audhere) {
          this.notifications.alert(
            this.translate.instant("The protocol specified is not available, please see the administrator.")
          ).subscribe();
        } else {
          this.notifications.alert(
            this.translate.instant(
              "Protocol did not load properly. Please validate your protocol before trying to load again."
            )
          ).subscribe();
        }
    }
}