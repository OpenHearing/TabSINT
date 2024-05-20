import { Injectable } from '@angular/core';
import { ResultsInterface } from '../models/results/results.interface';
import { ResultsModel } from '../models/results/results-model.service';
import { DiskModel } from '../models/disk/disk.service';
import { DiskInterface } from '../models/disk/disk.interface';
import { ProtocolModel } from '../models/protocol/protocol-model.service';
import { ProtocolModelInterface } from '../models/protocol/protocol-model.interface';
import _ from 'lodash';

@Injectable({
    providedIn: 'root',
})

export class ResultsService {
    results: ResultsInterface;
    disk: DiskInterface;
    protocol: ProtocolModelInterface;
    
    constructor (
        public resultsModel: ResultsModel,
        public protocolM: ProtocolModel,
        private diskModel: DiskModel
    ) {
        this.results = this.resultsModel.getResults();
        this.disk = this.diskModel.getDisk();
        this.protocol = this.protocolM.getProtocolModel();
    }
    
    /** Initializes Exam results before starting the first page.
     * @summary Initializes results with protocol ID, test date and other information. 
     * @models results, protocol, disk
    */
    initializeExamResults() {
        this.results.testResults = {
            protocolId: this.protocol.activeProtocol!.id || null,
            protocolName: this.protocol.activeProtocol!.name,
            testDateTime: new Date().toJSON(),
            elapsedTime: undefined,    
            protocol: _.cloneDeep(this.protocol.activeProtocol!),
            responses: [],
            softwareVersion: {
            // version: version.dm.tabsint,
            // date: version.dm.date,
            // rev: version.dm.rev
            //   tabsintPlugins: config.tabsintPlugins,
            //   platform: devices.platform,
            //   platformVersion: devices.version,
            //   network: null,
            //   tabletUUID: devices.UUID,
            //   tabsintUUID: devices.tabsintUUID,
            //   tabletModel: devices.model,
            },
            tabletLocation: this.disk.tabletLocation,
            partialResults: undefined,
            headset: this.protocol.activeProtocol!.headset || "None",
            calibrationVersion: {
                audioProfileVersion: this.protocol.activeProtocol!._audioProfileVersion,
                calibrationPySVNRevision: this.protocol.activeProtocol!._calibrationPySVNRevision,
                calibrationPyManualReleaseDate: this.protocol.activeProtocol!._calibrationPyManualReleaseDate
            },
            isAdminMode: this.disk.debugMode
        }
    };
    
    /** Initializes page results (testResults.responses) before starting the next page.
     * @summary Initializes results with page ID, response and other information. 
     * @param currentPage exam page to initialize.
     * @models results, protocol, disk
    */
    initializePageResults(currentPage:any) {
        this.results.current = {
            pageId: currentPage.id,
            response: undefined,
            correct: undefined,
            isSkipped: false,
            responseArea: currentPage.responseArea ? currentPage.responseArea.type : undefined,
            page: {
              wavfiles: currentPage.wavfiles,
              chaWavFiles: currentPage.chaWavFiles,
              image: currentPage.image,
              video: currentPage.video
            }
          };
    }

    /**
     * Push current page results to exam testResults.
     * @summary summary
     * @models models
     * @param parameter: description
     * @returns description:  type
     */
    pushResults(currentResults: any) {
        this.results.testResults.responses.push(currentResults);
    }

    /**
     * Save exam results
     * @summary summary
     * @models models
     * @param parameter: description
     * @returns description:  type
     */
    save() {
        // unimplemented
    }
}