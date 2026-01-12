import * as _ from 'lodash';
import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import Ajv from 'ajv';
const ajv = new Ajv({ useDefaults: true, strict: false });

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
import { FileService } from '../services/file.service';
import { ExamState, DeveloperProtocols, DeveloperProtocolsCalibration, DialogType, ProtocolServer } from '../utilities/constants';
import { Logger } from '../services/logger.service';
import { Tasks } from '../services/tasks.service';
import { Notifications } from '../services/notifications.service';
import { loadingProtocolDefaults } from '../utilities/defaults';
import { checkCalibrationFiles, checkControllers } from '../utilities/protocol-checks.function';
import { processProtocol } from '../utilities/process-protocol.function';
import { initializeLoadingProtocol } from '../utilities/initialize-loading-protocol';

import { protocolSchema } from '../../schema/protocol.schema';

@Injectable({
  providedIn: 'root',
})
export class ProtocolService {
  app: AppInterface;
  disk: DiskInterface;
  loading: LoadingProtocolInterface;
  protocolModel: ProtocolModelInterface;
  state: StateInterface;

  diskSubscription: Subscription | undefined;
  stateSubscription: Subscription | undefined;

  constructor(
    private readonly appModel: AppModel,
    private readonly diskModel: DiskModel,
    private readonly fileService: FileService,
    private readonly logger: Logger,
    private readonly notifications: Notifications,
    private readonly protocolM: ProtocolModel,
    private readonly stateModel: StateModel,
    private readonly translate: TranslateService,
    private readonly tasks: Tasks
  ) {
    this.app = this.appModel.getApp();
    this.protocolModel = this.protocolM.getProtocolModel();
    this.state = this.stateModel.getState();
    this.stateSubscription = this.stateModel.stateSubject.subscribe(updatedState => {
      this.state = updatedState;
    });
    this.disk = this.diskModel.getDisk();
    this.diskSubscription = this.diskModel.diskSubject.subscribe((updatedDisk: DiskInterface) => {
      this.disk = updatedDisk;
    });
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
  async load(meta: ProtocolMetaInterface, notify: boolean = false) {
    this.loading.meta = meta;
    this.loading.notify = notify;
    this.tasks.register('Load Protocol', 'Load Protocol');
    try {
      const loadError = await this.loadFiles();
      if (loadError === undefined) {
        await this.setCalibration();
        await this.initializeProtocol();
        let validationError = await this.validateIfCalledFor();
        // .then(loadCustomJs)
        // .then(validateCustomJsIfCalledFor)
        this.handleLoadErrors([validationError]);
      } else {
        this.notifyProtocolDidntLoadProperly();
      }
    } catch (error: unknown) {
      let err = error instanceof Error ? error.message : error;
      this.logger.error(`Could not load protocol. ${err}`);
      this.notifications
        .alert({
          title: 'Alert',
          content: 'Could not load protocol. See logs for more information.',
          type: DialogType.Alert,
        })
        .subscribe();
    } finally {
      this.tasks.deregister('Load Protocol');
    }
  }

  /**
   * Removes a protocol from TabSINT from the disk model
   * @summary Check if the protocol to delete exists or is an admin or developer protocol.
   * Removes it from the protocol model.
   * @models protocol, app, disk
   * @param p protocol to delete
   */
  delete(p: ProtocolMetaInterface): void {
    if (p.server === ProtocolServer.Developer) {
      this.logger.error('Trying to delete developer protocol ' + p.name + ', but this is not allowed');
      return;
    }

    try {
      let availProtocols = this.disk.availableProtocolsMeta;
      delete availProtocols[p.name];
      let updatedAvailableProtocolsMeta = availProtocols;
      this.diskModel.updateDiskModel('availableProtocolsMeta', updatedAvailableProtocolsMeta);
    } catch (error) {
      this.logger.error('Error trying to delete files: ' + error);
    }
  }

  private async loadFiles(): Promise<ProtocolErrorInterface | undefined> {
    let loadError: ProtocolErrorInterface | undefined = undefined;
    try {
      this.tasks.register('Load Files', 'Loading Files...');
      let protocol;
      let finalProtocol: ProtocolSchemaInterface;

      if (this.loading.meta.server == ProtocolServer.Developer) {
        protocol = DeveloperProtocols[this.loading.meta.name];
        finalProtocol = protocol;
      } else {
        const response = await this.fileService.readFile('protocol.json', this.loading.meta.contentURI);
        protocol = response?.content!;
        finalProtocol = JSON.parse(protocol);
      }

      if (!_.isUndefined(protocol)) {
        this.loading.protocol = { ...this.loading.meta, ...finalProtocol };
        this.diskModel.updateDiskModel('activeProtocolMeta', this.loading.meta);
      } else {
        loadError = {
          type: 'Load Files',
          error: 'Failed to parse protocol.json',
        };
      }
    } catch (err) {
      loadError = {
        type: 'Load Files',
        error: JSON.stringify(err),
      };
      this.logger.error('Error while loading files: ' + err);
    } finally {
      this.tasks.deregister('Load Files');
    }
    return loadError;
  }

  private async validate() {
    const validate = ajv.compile(protocolSchema);
    const isValid = validate(this.loading.protocol);
    this.logger.debug('AJV isValid? ' + isValid);
    this.logger.debug('AJV ERRORS: ' + validate.errors);
    let ret: ProtocolValidationResultInterface = {
      valid: isValid,
      error: validate.errors,
    };
    return ret;
  }

  private async validateIfCalledFor(): Promise<ProtocolErrorInterface | undefined> {
    if (this.disk.validateProtocols) {
      if (this.loading.notify) {
        this.tasks.register('Validate Protocol', 'Validating Protocol... This process could take several minutes');
      }
      let validationResult = await this.validate();
      this.tasks.deregister('Validate Protocol');
      if (validationResult.valid) {
        return;
      } else {
        let error: ProtocolErrorInterface = {
          type: 'Protocol Schema',
          error: JSON.stringify(validationResult.error),
        };
        this.logger.error('validateIfCalledFor failed with error: ' + error.error);
        return error;
      }
    } else {
      return;
    }
  }

  private handleLoadErrors(errors: Array<ProtocolErrorInterface | undefined>) {
    errors.forEach(error => {
      if (!_.isUndefined(error)) this.protocolModel.activeProtocol!.errors!.push(error);
    });

    this.tasks.register('Handle Load Errors', 'Checking Protocol Files...');
    let msg = checkCalibrationFiles(this.protocolModel.activeProtocol!);
    if (typeof msg === 'string') {
      this.logger.debug(msg);
      this.protocolModel.activeProtocol!.errors!.push({
        type: 'Calibration',
        error: msg,
      });
    } else {
      this.logger.debug('All calibration files found.');
    }

    checkControllers(this.protocolModel.activeProtocol!).forEach((e: ProtocolErrorInterface) => {
      this.protocolModel.activeProtocol!.errors!.push(e);
    });

    if (this.protocolModel.activeProtocol!.errors!.length > 0) {
      msg = 'The protocol contains the following errors and may not function properly.' + ' \n\n';
      for (let err of this.protocolModel.activeProtocol!.errors!) {
        msg += err.type + ':\n';
        msg += ' - ' + err.error + '\n';
      }
      this.logger.error(' Protocol contains the following errors: ' + JSON.stringify(this.protocolModel.activeProtocol!.errors));
      this.notifications
        .alert({
          title: 'Alert',
          content: msg,
          type: DialogType.Alert,
        })
        .subscribe();
    } else if (this.loading.notify) {
      msg = 'Successfully loaded protocol: ' + this.loading.meta.name;
      this.notifications
        .alert({
          title: 'Alert',
          content: msg,
          type: DialogType.Alert,
        })
        .subscribe();
    }
    this.tasks.deregister('Handle Load Errors');
  }

  private async initializeProtocol() {
    try {
      this.tasks.register('Initialize Protocol', 'Initializing Protocol...');
      this.loading = initializeLoadingProtocol(this.loading, this.logger, this.translate, this.disk, this.fileService);
      this.tasks.register('Initialize Protocol', 'Processing Protocol...');

      [this.protocolModel.activeProtocol, this.protocolModel.activeProtocolDictionary, this.protocolModel.activeProtocolFollowOnsDictionary] =
        await processProtocol(this.loading);

      if (this.protocolModel.activeProtocol && 'key' in this.protocolModel.activeProtocol) {
        if (this.protocolModel.activeProtocol.key !== undefined) {
          this.protocolModel.activeProtocol.publicKey = decodeURI(this.protocolModel.activeProtocol.key);
        }
      }

      this.diskModel.updateDiskModel('headset', this.protocolModel.activeProtocol.headset ?? 'None');

      // TODO: Implement this variable for tympan? Or remove it? We should implement for CHA and Tympan!
      if (this.loading.protocol._requiresCha) {
        this.logger.debug('This exam requires the CHA, attempting to connect...');
        // setTimeout(cha.connect, 1000);
      }

      this.stateModel.updateState({
        examIndex: 0,
        examState: ExamState.Ready,
      });
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new Error(`Failed to initialize protocol: ${error.message}`);
      } else {
        throw new Error(`Failed to initialize protocol: ${error}`);
      }
    } finally {
      this.tasks.deregister('Initialize Protocol');
    }
  }

  private async setCalibration() {
    this.loading.calibration = undefined;
    let calibration;
    if (this.loading.meta.server === ProtocolServer.Developer) {
      calibration = DeveloperProtocolsCalibration[this.loading.meta.name];
    } else {
      calibration = await this.fileService.readFile(this.loading.meta.contentURI + '/calibration.json');
    }
    if (calibration) {
      this.loading.calibration = JSON.parse(calibration);
    }
  }

  private notifyProtocolDidntLoadProperly() {
    this.logger.error('Protocol did not load properly');
    if (this.disk.audhere) {
      this.notifications
        .alert({
          title: 'Alert',
          content: this.translate.instant('The protocol specified is not available, please see the administrator.'),
          type: DialogType.Alert,
        })
        .subscribe();
    } else {
      this.notifications
        .alert({
          title: 'Alert',
          content: this.translate.instant('Protocol did not load properly. Please validate your protocol before trying to load again.'),
          type: DialogType.Alert,
        })
        .subscribe();
    }
  }
}
