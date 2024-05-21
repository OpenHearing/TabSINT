import { Injectable } from '@angular/core';
import { ResultsInterface, TestResults } from '../models/results/results.interface';
import { ResultsModel } from '../models/results/results-model.service';
import { DiskModel } from '../models/disk/disk.service';
import { DiskInterface } from '../models/disk/disk.interface';
import { ProtocolModel } from '../models/protocol/protocol-model.service';
import { ProtocolModelInterface } from '../models/protocol/protocol-model.interface';
import _ from 'lodash';
import { constructFilename } from '../utilities/results-helper-functions';
import { FileService } from './file.service';
import { Logger } from '../utilities/logger.service';

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
        private fileService: FileService,
        private logger: Logger,
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
            protocolId: this.protocol.activeProtocol!.id,
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
            headset: this.protocol.activeProtocol!.headset || "None",
            calibrationVersion: {
                audioProfileVersion: this.protocol.activeProtocol!._audioProfileVersion,
                calibrationPySVNRevision: this.protocol.activeProtocol!._calibrationPySVNRevision,
                calibrationPyManualReleaseDate: this.protocol.activeProtocol!._calibrationPyManualReleaseDate
            }
        }
    };
    
    /** Initializes page results before starting the page.
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
     * @models result
     * @param result partial or completed result.testResults
     */
    async save(result: TestResults) {
        // unimplemented
    }

    /**
     * Save testResults on the tablet at Documents/.tabsint-results-backup/ 
     * @models result
     * @param result partial or completed result.testResults
     */
    async backup(result: TestResults) {
        var filename = constructFilename(this.protocol.activeProtocol?.resultFilename, result.testDateTime);
        var dir = ".tabsint-results-backup/" + result.protocolName + "/";

        try {
            await this.fileService.writeFile(dir + filename, result.toString());
            this.logger.debug("Successfully exported backup result to file: " + dir + filename);
        } catch(e) {
            this.logger.error("Failed to export backup result to file with error: " + _(e).toJSON);
        }
        
    }
    
}