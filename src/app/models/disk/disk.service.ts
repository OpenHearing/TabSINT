import { Injectable } from '@angular/core';
import { DiskInterface } from './disk.interface';
import { ProtocolServer, ResultsMode } from '../../utilities/constants';

@Injectable({
    providedIn: 'root',
})

export class DiskModel {

    diskModel: DiskInterface = {
        headset: "None",
        cha: {
            embeddedFirmwareBuildDate: "",
            embeddedFirmwareTag: "",
            myCha: "",
            bluetoothType: ""
        },
        debugMode: true,
        pin: "7114",
        disableLogs: false,
        maxLogRows: 1000,
        disableAudioStreaming: true,
        tabletGain: 12.34,
        server: ProtocolServer.LocalServer,
        externalMode: false,
        appDeveloperMode: false,
        appDeveloperModeCount: 0,
        uploadSummary: [],
        suppressAlerts: false,
        showUploadSummary: true,
        resultsMode: ResultsMode.UploadOnly,
        preventUploads: false,
        preventExports: true,
        reloadingBrowser: false,
        downloadInProgress: false,
        validateProtocols: false,
        completedResults: [],
        currentResults: undefined,
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
        activeProtocol: {},
        loadedProtocols: [],
        mediaRepos: [],
        language: 'English',
        interApp: {
            appName: '',
            dataIn: '',
            dataOut: ''
        },
        audhere: ''
    }

    getDisk(): DiskInterface {
        return this.diskModel;
    }

}