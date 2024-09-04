import { Injectable } from '@angular/core';
import { ResultsInterface, ExamResults, CurrentResults } from '../models/results/results.interface';
import { ResultsModel } from '../models/results/results-model.service';
import { DiskModel } from '../models/disk/disk.service';
import { DiskInterface } from '../models/disk/disk.interface';
import { ProtocolModel } from '../models/protocol/protocol-model.service';
import { ProtocolModelInterface } from '../models/protocol/protocol.interface';
import _ from 'lodash';
import { constructFilename, getDateString } from '../utilities/results-helper-functions';
import { FileService } from '../utilities/file.service';
import { Logger } from '../utilities/logger.service';
import { SqLite } from '../utilities/sqLite.service';
import { DevicesInterface } from '../models/devices/devices.interface';
import { DevicesModel } from '../models/devices/devices.service';
import { PageInterface } from '../models/page/page.interface';
import { responseDefaultByResponseAreaType } from '../utilities/defaults';

@Injectable({
    providedIn: 'root',
})

export class ResultsService {
    results: ResultsInterface;
    disk: DiskInterface;
    protocol: ProtocolModelInterface;
    devices: DevicesInterface;
    
    constructor (
        public resultsModel: ResultsModel,
        public protocolM: ProtocolModel,
        public sqLite: SqLite,
        public devicesModel: DevicesModel,
        public diskModel: DiskModel,
        private fileService: FileService,
        private logger: Logger
    ) {
        this.results = this.resultsModel.getResults();
        this.disk = this.diskModel.getDisk();
        this.protocol = this.protocolM.getProtocolModel();
        this.devices = this.devicesModel.getDevices();
    }
    
    /** Initializes Exam results before starting the first page.
     * @summary Initializes results with protocol ID, test date and other information. 
     * @models results, protocol, disk
    */
    initializeExamResults() {
        this.results.currentExam = {
            protocolId: this.protocol.activeProtocol!.protocolId,
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
    initializePageResults(currentPage: PageInterface) {
        this.results.currentPage = {
            pageId: currentPage.id,
            response: _.isUndefined(currentPage.responseArea) ? '' : responseDefaultByResponseAreaType[currentPage.responseArea.type],
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
     * Push current page results to current exam results.
     * @models results
     * @param currentPageResults Results for the current page.
     */
    pushResults(currentPageResults: CurrentResults) {
        this.results.currentExam.responses.push(currentPageResults);
    }

    /**
     * Save exam results
     * @summary Save result in SQLite db, than backup results on tablet.
     * @models disk
     * @param result Partial or completed current exam result.
     */
    async save(result: ExamResults) {
        await this.sqLite.store("results",  JSON.stringify(result));
        await this.backup(result);
    }

    /**
     * Save current exam results on the tablet at Documents/.tabsint-results-backup/ 
     * @param result Partial or completed current exam result
     */
    async backup(result: ExamResults) {
        var filename = constructFilename(this.protocol.activeProtocol?.resultFilename, result.testDateTime, 'json');
        var dir = ".tabsint-results-backup/" + result.protocolName + "/";

        try {
            await this.fileService.writeFile(dir + filename, JSON.stringify(result));
        } catch(e) {
            this.logger.error("Failed to export backup result to file with error: " + _(e).toJSON);
        }
        
    }
    
    /**
     * Delete one exam result from the disk completed exam results and from the sqlite database.
     * @models disk
     */
    async deleteSingleResult(index: number) {
        this.sqLite.deleteSingleResult(index);
    }

    /**
     * Export an exam result to the tablet's local storage.
     * @summary Get the result from sqlite, write it to Android, remove
     * it from the disk completed exam results and from the sqlite database.
     * @models disk
     * @param index number: index of the result
     */
    async exportSingleResult(index: number) {
        let result = await this.sqLite.getSingleResult(index);
        await this.writeResultToFile(JSON.parse(result[0]));
        await this.sqLite.deleteSingleResult(index);
    }

    /**
     * Write result to tablet's local storage.
     * @summary Construct path and filename, write file to tablet, update disk upload summary.
     * @models disk
     * @param result exam result
     */
    async writeResultToFile(result: ExamResults) {
        var filename = constructFilename(this.protocol.activeProtocol?.resultFilename, result.testDateTime, '.json');
        let dir = this.disk.servers.localServer.resultsDir
            ? this.disk.servers.localServer.resultsDir
            : "tabsint-results";
        dir = dir +  "/" + this.protocol.activeProtocol?.name + "/" ;
        await this.fileService.writeFile(dir + filename, result.toString());
        this.diskModel.updateSummary(result);
        this.disk = this.diskModel.getDisk();
    }

}