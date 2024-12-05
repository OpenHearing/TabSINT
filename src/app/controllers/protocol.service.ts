import * as _ from 'lodash';
import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import Ajv from 'ajv';
const ajv = new Ajv()

import { LoadingProtocolInterface } from '../interfaces/loading-protocol-object.interface';
import { ProtocolValidationResultInterface } from '../interfaces/protocol-validation-result.interface';
import { ProtocolErrorInterface } from '../interfaces/protocol-error.interface';
import { ProtocolSchemaInterface } from '../interfaces/protocol-schema.interface';
import { DiskInterface } from '../models/disk/disk.interface';
import { AppInterface } from '../models/app/app.interface';
import { ProtocolModelInterface, ProtocolMetaInterface } from '../models/protocol/protocol.interface';
import { StateInterface } from '../models/state/state.interface';

import { DiskModel } from '../models/disk/disk.service';
import { ProtocolModel } from '../models/protocol/protocol-model.service';
import { AppModel } from '../models/app/app.service';
import { StateModel } from '../models/state/state.service';
import { FileService } from '../utilities/file.service';
import { ExamState, DeveloperProtocols, DeveloperProtocolsCalibration, DialogType, ProtocolServer} from '../utilities/constants';
import { Logger } from '../utilities/logger.service';
import { Tasks } from '../utilities/tasks.service';
import { Notifications } from '../utilities/notifications.service';
import { loadingProtocolDefaults } from '../utilities/defaults';
import { checkCalibrationFiles, checkControllers, checkPreProcessFunctions } from '../utilities/protocol-checks.function';
import { processProtocol } from '../utilities/process-protocol.function';
import { initializeLoadingProtocol } from '../utilities/initialize-loading-protocol';

import { protocolSchema } from '../../schema/protocol.schema';

@Injectable({
    providedIn: 'root',
})

export class ProtocolService {
    app: AppInterface;
    disk: DiskInterface;
    diskSubscription: Subscription | undefined;
    loading: LoadingProtocolInterface;
    protocolModel: ProtocolModelInterface;
    state: StateInterface;

    constructor(
        private readonly appModel: AppModel,
        private readonly diskModel: DiskModel,
        private readonly fileService: FileService,
        private readonly logger:Logger,
        private readonly notifications: Notifications,
        private readonly protocolM: ProtocolModel,
        private readonly stateModel: StateModel,
        private readonly translate: TranslateService,
        private readonly tasks: Tasks,
    ) {
        this.app = this.appModel.getApp();
        this.protocolModel = this.protocolM.getProtocolModel();
        this.state = this.stateModel.getState();
        this.disk = this.diskModel.getDisk();
        this.diskSubscription = this.diskModel.diskSubject.subscribe( (updatedDisk: DiskInterface) => {
            this.disk = updatedDisk;
        })    
        this.loading = loadingProtocolDefaults(this.disk);
    }

    /** Load all protocol files onto the protocolModel.activeProtocol object.
     * @summary Read and process protocol files 
     * including custom protocol files, validate the protocol against the schema.
     * Handle load errors.
     * @models protocol, disk
     * @param meta meta data for the protocol to load,
     * @param notify whether to use task banners to notify user about progress. Default: false.
    */
    async load(
        meta: ProtocolMetaInterface,
        notify: boolean = false
    ) {
        this.loading.meta = meta;
        this.loading.notify = notify;

        try {
            await this.loadFiles();
            this.setCalibration();
            let validationError = await this.validateIfCalledFor();
            this.initializeProtocol();
                // .then(loadCustomJs)
                // .then(validateCustomJsIfCalledFor)
            this.handleLoadErrors(validationError);
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
     * Removes a protocol from TabSINT from the disk model
     * @summary Check if the protocol to delete exists or is an admin or developer protocol.
     * Removes it from the protocol model.
     * @models protocol, app, disk
     * @param p protocol to delete
     */
    delete(p: ProtocolMetaInterface): void {
        if (p.server === ProtocolServer.Developer) {
            this.logger.error("Trying to delete developer protocol " + p.name + ", but this is not allowed");
            return;
        }

        try {
            let availProtocols = this.disk.availableProtocolsMeta;
            delete availProtocols[p.name];
            let updatedAvailableProtocolsMeta = availProtocols;
            this.diskModel.updateDiskModel('availableProtocolsMeta', updatedAvailableProtocolsMeta);
        } catch (error) {
            this.logger.error("Error trying to delete files: " + error);
        }
    };

    private async loadFiles() {
        try {
            let protocol;
            let finalProtocol: ProtocolSchemaInterface;

            if (this.loading.meta.server == ProtocolServer.Developer) {
                protocol = DeveloperProtocols[this.loading.meta.name];
                finalProtocol = protocol;
            } else {
                const response = await this.fileService.readFile("protocol.json", this.loading.meta.contentURI);
                protocol = response?.content!;
                finalProtocol = JSON.parse(protocol);
            }

            if (!_.isUndefined(protocol)) {
                this.loading.protocol = {...this.loading.meta, ...finalProtocol };
                this.diskModel.updateDiskModel('activeProtocolMeta', this.loading.meta);
            } else {
                this.notifyProtocolDidntLoadProperly();
            }

        } catch(err) {
            this.logger.error("Error while loading files: " + err);
        }
    }

    private async validate() {
        const validate = ajv.compile(protocolSchema);
        const isValid = validate(this.loading.protocol);
        this.logger.debug('AJV isValid? ' + isValid);
        this.logger.debug('AJV ERRORS: ' + validate.errors);
        let ret: ProtocolValidationResultInterface = {
            valid: isValid,
            error: validate.errors
        };
        return ret;
    }

    private async validateIfCalledFor() {
        if (this.loading.notify) {
            this.tasks.register("updating protocol", "Validating Protocol... This process could take several minutes");
        }

        if (this.disk.validateProtocols) {
            let validationResult = await this.validate();
            if (validationResult.valid) {
                return;
            } else {
                let error: ProtocolErrorInterface = {
                    type: "Protocol Schema",
                    error: JSON.stringify(validationResult.error)
                };
                this.logger.error("validateIfCalledFor failed with error: " + error.error);
                return error;
            }
        } else {
            return;
        }
    }

    private handleLoadErrors(validationError?: ProtocolErrorInterface) {

        if (!_.isUndefined(validationError)) this.protocolModel.activeProtocol!.errors!.push(validationError);

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
            for (let err of this.protocolModel.activeProtocol!.errors!) {
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
                this.loading.meta.name;
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
            this.disk,
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

        this.diskModel.updateDiskModel('headset', this.protocolModel.activeProtocol.headset ?? "None");

        if (this.loading.protocol._requiresCha) {
            this.logger.debug("This exam requires the CHA, attempting to connect...");
        // setTimeout(cha.connect, 1000);
        }

        this.state.examIndex = 0;
        this.state.examState = ExamState.Ready;
    }

    private async setCalibration() {
        this.loading.calibration = undefined;
        let calibration;
        if (this.loading.meta.server === ProtocolServer.Developer) {
            calibration = DeveloperProtocolsCalibration[this.loading.meta.name];
        } else {
            calibration = await this.fileService.readFile(this.loading.meta.contentURI + "/calibration.json");
        }
        if (calibration) {
            this.loading.calibration = JSON.parse(calibration);
        }

    }

    private notifyProtocolDidntLoadProperly() {
        this.logger.error("Protocol did not load properly");
        if (this.disk.audhere) {
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
