import { Injectable } from '@angular/core';
import { DiskModel } from './disk.interface';
import { ResultsMode } from '../../utilities/constants';

@Injectable({
    providedIn: 'root',
})

export class DiskM {

    diskM: DiskModel = {
        headset: "None",
        disableAudioStreaming: true,
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
        language: '',
        interApp: {
            appName: '',
            dataIn: '',
            dataOut: ''
        },
        audhere: ''
    }

}