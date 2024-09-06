import { TranslateService } from "@ngx-translate/core";
import { LoadingProtocolInterface } from "../interfaces/loading-protocol-object.interface";
import { DiskModel } from "../models/disk/disk.service";
import { Logger } from "./logger.service";
import _ from "lodash";
import { loadingProtocolDefaults } from "./defaults";
import { FileService } from "./file.service";

export function initializeLoadingProtocol(
    loading: LoadingProtocolInterface,
    logger: Logger,
    translate: TranslateService,
    diskModel: DiskModel, 
    fileService: FileService) {

    let msg: string='';

    initializeVariables();
    checkPublicKeyError();
    checkTabsintVersion();
    confirmEPHD1IsConnectedWhenHeadsetIsEPHD1();
    checkCalibration();
    setMediaRepo();

    return loading;
        
    function initializeVariables() {
        loading.protocol._exportCSV = false;
        loading.protocol._protocolIdDict = {};
        loading.protocol._preProcessFunctionList = [];
        loading.protocol._missingPreProcessFunctionList = [];
        loading.protocol._missingControllerList = [];
        loading.protocol._customHtmlList = [];
        loading.protocol._missingHtmlList = [];
        loading.protocol._missingWavCalList = [];
        loading.protocol._missingCommonWavCalList = [];
        loading.protocol._requiresCha = false;
        loading.protocol.errors = [];
        loading.protocol.cCommon = [];
    }

    function checkPublicKeyError () {
        if (diskModel.disk.requireEncryptedResults && !loading.protocol.publicKey) {
            loading.protocol.errors!.push({
                type: translate.instant("Public Key"),
                error: translate.instant(
                    'No public encryption key is defined in the protocol. ' + 
                    'Results will not be recorded from this protocol while the "Require Encryption" setting is enabled.'
                )
            });
        }
    }

    // TODO: Fix this function
    function checkTabsintVersion() {
        loading.protocol.protocolTabsintOutdated = false;
        if (loading.protocol.minTabsintVersion) {
            // const mtv = _.map(loading.protocol.minTabsintVersion.split("."), function(s) {
            //     return parseInt(s);
            // }); //
            // const ctv = _.map(version.dm.tabsint.split("-")[0].split("."), function(s) {
            //     return parseInt(s);
            // });

            if ( false
                // mtv[0] < ctv[0] ||
                // (mtv[0] === ctv[0] && mtv[1] < ctv[1]) ||
                // (mtv[0] === ctv[0] && mtv[1] === ctv[1] && mtv[2] <= ctv[2])
            ) {
                logger.debug(
                "Tabsint version " +
                    // version.dm.tabsint +
                    ", Protocol requires tabsint version " +
                    loading.protocol.minTabsintVersion
                );
            } else {
                msg =
                    translate.instant("Protocol requires tabsint version ") +
                    loading.protocol.minTabsintVersion +
                    translate.instant(", but current Tabsint version is ")
                // version.dm.tabsint;
                logger.error(msg);
                loading.protocol.errors!.push({
                    type: translate.instant("TabSINT Version"),
                    error: msg
                });
                loading.protocol.protocolTabsintOutdated = true;
            }
        }
    }

    function confirmEPHD1IsConnectedWhenHeadsetIsEPHD1() {
        loading.protocol.protocolUsbCMissing = false; // default/reset to false.
        if (loading.protocol.headset === "EPHD1") {
            // loading.protocol.protocolUsbCMissing = !tabsintNative.isUsbConnected;
            console.log("About to run registerUsbDeviceListener()");
        // tabsintNative.registerUsbDeviceListener(api.usbEventCallback);
        } else {
        // tabsintNative.unregisterUsbDeviceListener(api.usbEventCallback);
        }
    }

    function checkCalibration() {
        const reqCalProperties = [
            "headset",
            "tablet",
            "audioProfileVersion",
            "calibrationPySVNRevision",
            "calibrationPyManualReleaseDate"
        ];
        if (_.difference(_.keys(loading.calibration), reqCalProperties).length > 0) {
            // if (_.intersection(_.keys(loading.calibration), reqCalProperties).length === reqCalProperties.length) {
            //     loading.protocol.headset = loading.calibration.headset;
            //     loading.protocol._audioProfileVersion = loading.calibration.audioProfileVersion;
            //     loading.protocol._calibrationPySVNRevision = loading.calibration.calibrationPySVNRevision;
            //     loading.protocol._calibrationPyManualReleaseDate = loading.calibration.calibrationPyManualReleaseDate;
            // } else {
            //     loading.protocol._audioProfileVersion = "none";
            //     loading.protocol._calibrationPySVNRevision = "none";
            //     loading.protocol._calibrationPyManualReleaseDate = "none";
            //     msg = "The loaded protocol calibration file is missing version fields.";
            //     logger.error(msg);
            //     loading.protocol.errors!.push({
            //     type: "Calibration",
            //     error: msg
            //     });
            // }
        }
        loading.protocol.currentCalibration = loading.protocol.headset || "None"; 
    }

    function setMediaRepo() {
        if (loading.protocol.commonMediaRepository) {
            const midx = _.findIndex(diskModel.disk.mediaRepos, {
                name: loading.protocol.commonMediaRepository
            });
            if (midx !== -1) {
                loading.protocol.commonRepo = diskModel.disk.mediaRepos[midx];
                loading.protocol.cCommon = fileService.readFile(loading.protocol.commonRepo.path + "calibration.json");
            } else {
                msg =
                "The media repository referenced by this protocol is not available (" +
                loading.protocol.commonMediaRepository +
                "). " +
                "Please try updating this protocol to automatically download the media repository";
                logger.error("media repository referenced by protocol is not available: " + 
                    loading.protocol.commonMediaRepository);
                loading.protocol.errors!.push({
                type: "Media",
                error: msg
                });
            }
        }
    }

}