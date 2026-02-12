import { TranslateService } from '@ngx-translate/core';
import _ from 'lodash';

import { LoadingProtocolInterface } from '../interfaces/loading-protocol-object.interface';
import { Logger } from '../services/logger.service';
import { FileService } from '../services/file.service';
import { DiskInterface } from '../models/disk/disk.interface';
import { CalibrationFileInterface } from '../interfaces/calibration-file.interface';

export async function initializeLoadingProtocol(
  loading: LoadingProtocolInterface,
  logger: Logger,
  translate: TranslateService,
  disk: DiskInterface,
  fileService: FileService
): Promise<LoadingProtocolInterface> {
  let msg: string = '';

  initializeVariables();
  checkPublicKeyError();
  checkTabsintVersion();
  confirmEPHD1IsConnectedWhenHeadsetIsEPHD1();
  setProtocolCalibrationData();
  await setMediaRepo();

  return loading;

  function initializeVariables() {
    loading.protocol._exportCSV = false;
    loading.protocol._protocolIdDict = {};
    loading.protocol._missingControllerList = [];
    loading.protocol._customHtmlList = [];
    loading.protocol._missingHtmlList = [];
    loading.protocol._missingWavCalList = [];
    loading.protocol._missingCommonWavCalList = [];
    loading.protocol._requiresCha = false;
    loading.protocol.errors = [];
    loading.protocol.cCommon = undefined;
  }

  function checkPublicKeyError() {
    if (disk.preferences.requireEncryptedResults && !loading.protocol.publicKey) {
      loading.protocol.errors!.push({
        type: translate.instant('Public Key'),
        error: translate.instant(
          'No public encryption key is defined in the protocol. ' +
            'Results will not be recorded from this protocol while the "Require Encryption" setting is enabled.'
        ),
      });
    }
  }

  // TODO: Fix this function
  function checkTabsintVersion() {
    loading.protocol.protocolTabsintOutdated = false;
    if (loading.protocol.minTabsintVersion) {
      /*
       const mtv = _.map(loading.protocol.minTabsintVersion.split("."), function(s) {
           return parseInt(s);
       }); 
       const ctv = _.map(version.dm.tabsint.split("-")[0].split("."), function(s) {
           return parseInt(s);
       });

      if (
        mtv[0] < ctv[0] ||
        (mtv[0] === ctv[0] && mtv[1] < ctv[1]) ||
        (mtv[0] === ctv[0] && mtv[1] === ctv[1] && mtv[2] <= ctv[2])
      ) {
        logger.debug(
          'Tabsint version ' +
            // version.dm.tabsint +
            ', Protocol requires tabsint version ' +
            loading.protocol.minTabsintVersion
        );
      */

      msg =
        translate.instant('Protocol requires tabsint version ') +
        loading.protocol.minTabsintVersion +
        translate.instant(', but current Tabsint version is ');
      // version.dm.tabsint;
      logger.error(msg);
      loading.protocol.errors!.push({
        type: translate.instant('TabSINT Version'),
        error: msg,
      });
      loading.protocol.protocolTabsintOutdated = true;
    }
  }

  function confirmEPHD1IsConnectedWhenHeadsetIsEPHD1() {
    loading.protocol.protocolUsbCMissing = false; // default/reset to false.
    // if (loading.protocol.headset === "EPHD1") {
    // loading.protocol.protocolUsbCMissing = !tabsintNative.isUsbConnected;
    // tabsintNative.registerUsbDeviceListener(api.usbEventCallback);
    // } else {
    // tabsintNative.unregisterUsbDeviceListener(api.usbEventCallback);
    // }
  }

  /**
   * Set the calibration information at the protocol level based on the calibration.json file.
   */
  function setProtocolCalibrationData() {
    const calibration = structuredClone(loading.calibration);
    if (calibration) {
      loading.protocol.headset = calibration.headset;
      loading.protocol._audioProfileVersion = calibration.audioProfileVersion;
      loading.protocol._calibrationPySVNRevision = calibration.calibrationPySVNRevision;
      loading.protocol._calibrationPyManualReleaseDate = String(calibration.calibrationPyManualReleaseDate);
    }
    loading.protocol.currentCalibration = loading.protocol.headset;
  }

  async function setMediaRepo(): Promise<void> {
    if (loading.protocol.commonMediaRepository) {
      const midx = _.findIndex(disk.mediaRepos, {
        name: loading.protocol.commonMediaRepository,
      });
      if (midx !== -1) {
        loading.protocol.commonRepo = disk.mediaRepos[midx];
        const cCommonFile = await fileService.readFile(loading.protocol.commonRepo.path + 'calibration.json');
        const cCommon = cCommonFile ? JSON.parse(cCommonFile.content) : undefined;
        loading.protocol.cCommon = cCommon as CalibrationFileInterface | undefined;
      } else {
        msg =
          'The media repository referenced by this protocol is not available (' +
          loading.protocol.commonMediaRepository +
          '). ' +
          'Please try updating this protocol to automatically download the media repository';
        logger.error('media repository referenced by protocol is not available: ' + loading.protocol.commonMediaRepository);
        loading.protocol.errors!.push({
          type: 'Media',
          error: msg,
        });
      }
    }
  }
}
