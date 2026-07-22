import * as _ from 'lodash';
import { inject, Injectable } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import { Subscription } from 'rxjs';
import Ajv, { JSONSchemaType } from 'ajv';

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
import { checkCalibrationFiles, checkControllers, checkUnresolvedFilePaths, protocolHasWavFiles } from '../utilities/protocol-checks.function';
import { processProtocol } from '../utilities/process-protocol.function';
import { initializeLoadingProtocol } from '../utilities/initialize-loading-protocol';

import { protocolSchema } from '../../schema/protocol.schema';
import { calibrationFileSchema } from '../../schema/definitions/calibration-file.schema';

@Injectable({
  providedIn: 'root',
})
export class ProtocolService {
  private readonly appModel = inject(AppModel);
  private readonly diskModel = inject(DiskModel);
  private readonly fileService = inject(FileService);
  private readonly logger = inject(Logger);
  private readonly notifications = inject(Notifications);
  private readonly protocolM = inject(ProtocolModel);
  private readonly stateModel = inject(StateModel);
  private readonly transloco = inject(TranslocoService);
  private readonly tasks = inject(Tasks);

  app: AppInterface;
  disk: DiskInterface;
  loading: LoadingProtocolInterface;
  protocolModel: ProtocolModelInterface;
  state: StateInterface;

  diskSubscription: Subscription | undefined;
  stateSubscription: Subscription | undefined;

  constructor() {
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
      const allErrors = loadError !== undefined ? [loadError] : [];
      if (loadError === undefined) {
        await this.setCalibration();
        await this.initializeProtocol();
        await this.validateIfCalledFor();
        const protocolErrors = this.checkProtocolErrors();
        allErrors.push(...(protocolErrors ?? []));
      }
      if (allErrors.length > 0) {
        if (loadError !== undefined || this.disk.preferences.validateProtocols) {
          this.notifyProtocolLoadError(allErrors);
          this.protocolModel.activeProtocol = undefined;
        } else {
          this.notifyProtocolLoadWarning(allErrors);
        }
      } else {
        this.notifyProtocolLoadSuccess();
      }
    } catch (error: unknown) {
      const err = error instanceof Error ? error.message : error;
      this.protocolModel.activeProtocol = undefined;
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
      const availProtocols = this.disk.availableProtocolsMeta;
      delete availProtocols[p.name];
      const updatedAvailableProtocolsMeta = availProtocols;
      this.diskModel.updateDiskModel({ availableProtocolsMeta: updatedAvailableProtocolsMeta });
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
        protocol = response?.content;
        finalProtocol = protocol ? JSON.parse(protocol) : undefined;
      }

      if (!_.isUndefined(protocol)) {
        this.loading.protocol = { ...this.loading.meta, ...finalProtocol };
        this.diskModel.updateDiskModel({ activeProtocolMeta: this.loading.meta });
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

  /**
   * Validate an object against a provided schema.
   * @param data The data to be validated.
   * @param schema The schema to validate against.
   * @returns A validation result containing whether the data is valid and any errors.
   */
  private validate<T = unknown>(data: object, schema: JSONSchemaType<T>): ProtocolValidationResultInterface {
    const ajv = new Ajv({ useDefaults: true, strict: false });
    const validateAjv = ajv.compile(schema);
    const isValid = validateAjv(data);
    this.logger.debug('AJV isValid? ' + isValid);
    this.logger.debug('AJV ERRORS: ' + validateAjv.errors);
    const ret: ProtocolValidationResultInterface = {
      valid: isValid,
      error: validateAjv.errors,
    };
    return ret;
  }

  private async validateIfCalledFor() {
    if (!this.disk.preferences.validateProtocols) return undefined;
    if (this.loading.notify) {
      this.tasks.register('Validate Protocol', 'Validating Protocol... This process could take several minutes');
    }
    const protocolValidationResult = this.validate(this.loading.protocol, protocolSchema);
    let calibrationValidationResult: ProtocolValidationResultInterface = { valid: true, error: null };
    if (this.loading.calibration) {
      calibrationValidationResult = this.validate(this.loading.calibration, calibrationFileSchema);
    }
    this.tasks.deregister('Validate Protocol');
    if (!protocolValidationResult.valid || !calibrationValidationResult.valid) {
      const protocolErrors = JSON.stringify(protocolValidationResult.error) ?? '';
      const calibrationErrors = JSON.stringify(calibrationValidationResult.error) ?? '';
      const errorType =
        (protocolErrors ? 'Protocol Schema' : '') +
        (protocolErrors && calibrationErrors ? ' and ' : '') +
        (calibrationErrors ? 'Calibration Schema' : '');
      const error: ProtocolErrorInterface = {
        type: errorType,
        error: protocolErrors + calibrationErrors,
      };
      this.logger.error('validateIfCalledFor failed with error: ' + error.error);
      this.protocolModel.activeProtocol!.errors!.push(error);
    }
  }

  private checkProtocolErrors(): ProtocolErrorInterface[] | undefined {
    this.tasks.register('Handle Load Errors', 'Checking Protocol Files...');
    const msg = checkCalibrationFiles(this.protocolModel.activeProtocol!);
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

    checkUnresolvedFilePaths(this.protocolModel.activeProtocol!).forEach((e: ProtocolErrorInterface) => {
      this.protocolModel.activeProtocol!.errors!.push(e);
    });

    this.tasks.deregister('Handle Load Errors');
    return this.protocolModel.activeProtocol?.errors ?? [];
  }

  private async initializeProtocol() {
    try {
      this.tasks.register('Initialize Protocol', 'Initializing Protocol...');
      this.loading = await initializeLoadingProtocol(this.loading, this.logger, this.transloco, this.disk, this.fileService);
      this.tasks.register('Initialize Protocol', 'Processing Protocol...');

      [this.protocolModel.activeProtocol, this.protocolModel.activeProtocolDictionary, this.protocolModel.activeProtocolFollowOnsDictionary] =
        await processProtocol(this.loading);

      this.stateModel.updateState({
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
    if (!protocolHasWavFiles(this.loading.protocol)) return;

    let calibration;
    if (this.loading.meta.server === ProtocolServer.Developer) {
      calibration = DeveloperProtocolsCalibration[this.loading.meta.name];
      this.loading.calibration = calibration;
    } else {
      // The loaded calibration file is validated as necessary in validateIfCalledFor
      const calibrationFile = await this.fileService.readFile('calibration.json', this.loading.meta.contentURI);
      calibration = calibrationFile?.content;
      this.loading.calibration = calibration ? JSON.parse(calibration) : undefined;
    }
  }

  private notifyProtocolLoadSuccess() {
    if (this.loading.notify) {
      const msg = 'Successfully loaded protocol: ' + this.loading.meta.name;
      this.notifications
        .alert({
          title: 'Alert',
          content: msg,
          type: DialogType.Alert,
        })
        .subscribe();
    }
  }

  private notifyProtocolLoadError(errors: ProtocolErrorInterface[]) {
    if (this.disk.audhere) {
      this.notifications
        .alert({
          title: 'Alert',
          content: this.transloco.translate('The protocol specified is not available, please see the administrator.'),
          type: DialogType.Alert,
        })
        .subscribe();
    } else {
      let msg = 'The protocol contains the following errors and will not be loaded.' + ' \n\n';

      for (const err of errors) {
        msg += err.type + ':\n';
        msg += ' - ' + err.error + '\n';
      }

      this.logger.error('Protocol contains the following errors: ' + JSON.stringify(errors));
      this.notifications
        .alert({
          title: 'Alert',
          content: msg,
          type: DialogType.Alert,
        })
        .subscribe();
    }
  }

  private notifyProtocolLoadWarning(errors: ProtocolErrorInterface[]) {
    let msg = 'The protocol contains the following errors and may not function properly.' + ' \n\n';
    for (const err of errors) {
      msg += err.type + ':\n';
      msg += ' - ' + err.error + '\n';
    }
    this.logger.error('Protocol contains the following errors: ' + JSON.stringify(errors));
    this.notifications
      .alert({
        title: 'Alert',
        content: msg,
        type: DialogType.Alert,
      })
      .subscribe();
  }
}
