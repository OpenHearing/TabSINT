import { Inject, Injectable } from '@angular/core';
import _ from 'lodash';
import { DOCUMENT } from '@angular/common';

import { DiskInterface } from './disk.interface';
import { ProtocolServer, ResultsMode } from '../../utilities/constants';
import { partialMetaDefaults } from '../../utilities/defaults';
import { ExamResults } from '../results/results.interface';

@Injectable({
    providedIn: 'root',
})

export class DiskModel {

    window: (Window & typeof globalThis) | null;

    disk: DiskInterface = {
        adminSkipMode: false,
        appDeveloperMode: false,
        appDeveloperModeCount: 0,
        audhere: '',
        autoUpload: true,
        availableProtocolsMeta: {
            "Creare Audiometry": {
                ...partialMetaDefaults,
                creator: "Creare",
                name: "Creare Audiometry",
                path: "protocols/creare-audiometry"
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
        contentURI: undefined,
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
        headset: "None",
        init: true, // TODO: when set to true, this is the initial opening of the app and disclaimer should be displayed
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
        suppressAlerts: false,
        tabletGain: 12.34,
        tabletLocation: {},
        uploadSummary: [],
        validateProtocols: true,
        versionCheck: false
    };
    
    
    
    constructor(
        @Inject(DOCUMENT) private document: Document
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
    }

    updateDiskModel(key: string, value: any) {
        _.set(this.disk, key, value);
        this.storeDisk();
    }
    
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
        this.updateDiskModel("uploadSummary", this.disk.uploadSummary);
    }
}