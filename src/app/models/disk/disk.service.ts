import { Inject, Injectable } from '@angular/core';
import _ from 'lodash';
import { DOCUMENT } from '@angular/common';
import { BehaviorSubject } from 'rxjs';

import { DiskInterface, GitlabConfigInterface } from './disk.interface';
import { ExamResults } from '../results/results.interface';
import { ProtocolServer, ResultsMode } from '../../utilities/constants';
import { metaDefaults, partialMetaDefaults } from '../../utilities/defaults';

@Injectable({
    providedIn: 'root',
})

export class DiskModel {

    gitlabConfigModel: GitlabConfigInterface = {
        repository: '',
        tag: '',
        host: 'https://gitlab.com/',
        token: '',
        group: ''
    };
 

    window: (Window & typeof globalThis) | null;

    disk: DiskInterface = {
        activeProtocolMeta: metaDefaults,
        adminSkipMode: false,
        appDeveloperMode: false,
        appDeveloperModeCount: 0,
        audhere: '',
        autoUpload: true,
        availableProtocolsMeta: {
            PurdueShakedown: {
                ...partialMetaDefaults,
                creator: "Creare",
                name: "PurdueShakedown",
                path: "protocols/purdue-shakedown"
            },
            develop: {
                ...partialMetaDefaults,
                creator: "Creare",
                name: "develop",
                path: "protocols/develop"
            }
        },
        cha: {
            bluetoothType: '',
            embeddedFirmwareBuildDate: '',
            embeddedFirmwareTag: '',
            myCha: ''
        },
        contentURI: null,
        debugMode: true,
        disableAudioStreaming: true,
        disableLogs: false,
        downloadInProgress: false,
        externalMode: false,
        gitlab: {
            repos: [],
            useSeperateResultsRepo: false,
            useTagsOnly: true
        },
        gitlabConfig: this.gitlabConfigModel,
        headset: "None",
        interApp: {
            appName: '',
            dataIn: '',
            dataOut: ''
        },
        language: "English",
        lastReleaseCheck: '',
        mediaRepos: [],
        maxLogRows: 1000,
        numLogRows: 0,
        pin: "7114",
        preventExports: false,
        preventUploads: true,
        reloadingBrowser: false,
        requireEncryptedResults: false,
        resultsMode: ResultsMode.ExportOnly,
        server: ProtocolServer.LocalServer,
        servers: {
            gitlab: {
                resultsRepo: "results"
            },
            localServer: {
                protocolDir: "tabsint-protocols",
                resultsDir: "tabsint-results",
                resultsDirUri: ''
            }
        },
        showUploadSummary: true,
        showDisclaimer: true,
        suppressAlerts: false,
        tabletGain: 12.34,
        tabletLocation: {},
        uploadSummary: [],
        validateProtocols: true,
        versionCheck: false,
        savedDevices: { "tympan": [], "cha": [], "svantek": [] },
    };
    
    diskSubject = new BehaviorSubject<DiskInterface>(this.disk);
    
    constructor(
        @Inject(DOCUMENT) private readonly document: Document
    ) {
        this.window = document.defaultView;
    }

    /**
     * Get the disk model from local storage
     * @summary When window and local storage are defined, grab diskModel if available, otherwise set diskModel to local storage
     * @returns  DiskInterface: disk model saved on local storage
     */
    getDisk(): DiskInterface {
        if (this.window !== null && !_.isUndefined(this.window.localStorage)) {
            if (this.window.localStorage.getItem('diskModel') !== null) {
                this.disk = JSON.parse(this.window.localStorage.getItem('diskModel')!);
            } else {
                this.storeDisk();
            }
        }
        return this.disk;
    }

    /**
     * Store disk model on local storage
     * @summary When window and local storage are defined, store disk model on local storage\
     */
    storeDisk(): void {
        if (this.window !== null && !_.isUndefined(this.window.localStorage)) {
            this.window.localStorage.setItem('diskModel', JSON.stringify(this.disk));
        }
        this.diskSubject.next(this.getDisk());
    }

    /**
     * Convenience function to update disk in local storage.
     * @summary Set key: value on the disk model, then store the disk model on local storage.
     * @models disk
     * @param key: key of the parameter to update on the disk model
     * @param value: value to change the parameter to 
     */
    updateDiskModel(key: string, value: any) {
        if (_.has(this.disk, key)) {
            _.set(this.disk, key, value);
            this.storeDisk();
        }
    }
    
    /**
     * Update summary info that is used to display recently exported or uploaded results
     * @summary Add result meta data to disk.uploadSumary, then store it on local storage
     * @models disk
     * @param result: exam result
     */
    updateSummary(result: ExamResults) {
        const meta = {
            protocolId: result.protocolId,
            protocolName: result.protocolName,
            testDateTime: result.testDateTime!,
            nResponses: _.isUndefined(result.responses) ? 0 : result.responses.length,
            source: result.protocol.server,
            output: result.exportLocation ?? result.protocol.server,
            uploadedOn: new Date().toJSON()
        };
        this.disk.uploadSummary.unshift(meta);
        this.storeDisk();
    }
}