import { Inject, Injectable } from '@angular/core';
import _ from 'lodash';
import { DOCUMENT } from '@angular/common';

import { DiskInterface } from './disk.interface';
import { ProtocolServer, ResultsMode } from '../../utilities/constants';
import { metaDefaults } from '../../utilities/defaults';
import { ExamResults } from '../results/results.interface';

@Injectable({
    providedIn: 'root',
})

export class DiskModel {

    window: (Window & typeof globalThis) | null;

    disk: DiskInterface = {
        headset: "None",
        cha: {
            embeddedFirmwareBuildDate: "",
            embeddedFirmwareTag: "",
            myCha: "",
            bluetoothType: ""
        },
        debugMode: true,
        adminSkipMode: false,
        pin: "7114",
        disableLogs: false,
        maxLogRows: 1000,
        numLogRows:0,
        disableAudioStreaming: true,
        tabletGain: 12.34,
        server: ProtocolServer.LocalServer,
        externalMode: false,
        appDeveloperMode: false,
        appDeveloperModeCount: 0,
        uploadSummary: [],
        suppressAlerts: false,
        showUploadSummary: true,
        resultsMode: ResultsMode.ExportOnly,
        preventUploads: true,
        preventExports: false,
        reloadingBrowser: false,
        downloadInProgress: false,
        validateProtocols: true,
        tabletLocation: {},
        gitlab: {
            repos: [],
            useTagsOnly: true,
            useSeperateResultsRepo: false
        },
        servers: {
            localServer: {
                resultsDir: "tabsint-results",
                protocolDir: "tabsint-protocols",
            },
            gitlab: {
                resultsRepo: "results"
            }
        },
        init: true, // when set to true, this is the initial opening of the app and disclaimer should be displayed
        versionCheck: false,
        lastReleaseCheck: '',
        mediaRepos: [],
        language: 'English',
        interApp: {
            appName: '',
            dataIn: '',
            dataOut: ''
        },
        audhere: '',
        activeProtocolMeta: metaDefaults,
        availableProtocolsMeta: [],
        completedExamsResults: []
    };
    
    constructor(@Inject(DOCUMENT) private document: Document) {
        this.window = document.defaultView;
    }

    /**
     * Get the disk model from local storage
     * @summary When window and local storage are defined, grab diskModel if available, otherwise set diskModel to local storage
     * @returns  DiskInterface: disk model saved on local storage
     */
    getDisk(): DiskInterface {
        if (this.window !== null && !_.isUndefined(this.window!.localStorage)) {
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
        if (this.window !== null && !_.isUndefined(this.window!.localStorage)) {
            this.window.localStorage.setItem('diskModel', JSON.stringify(this.disk));
            console.log("localStorage storeDisk: ", this.window!.localStorage);
        }
    }

    updateDiskModel(key: any, value: any) {
        (this.disk as any)[key] = value; // TODO: improve typing here
        this.storeDisk();
        console.log("updateDiskModel: ", this.disk);
    }
    
    emptyCompletedExamResults() {
        this.disk.completedExamsResults = [];
        this.updateDiskModel("completedExamsResults", this.disk.completedExamsResults);
    }

    removeResultFromCompletedExamResults(index: number) {
        this.disk.completedExamsResults.splice(index, 1);
        this.updateDiskModel("completedExamsResults", this.disk.completedExamsResults);
    }

    updateSummary(result: ExamResults) {
        var meta = {
            protocolId: result.protocolId,
            protocolName: result.protocolName,
            testDateTime: result.testDateTime!,
            nResponses: result.responses.length,
            source: result.protocol.server,
            output: result.exportLocation || result.protocol.server,
            uploadedOn: new Date().toJSON()
        };
        this.disk.uploadSummary.unshift(meta);
        this.updateDiskModel("uploadSummary", this.disk.uploadSummary);
    }
}