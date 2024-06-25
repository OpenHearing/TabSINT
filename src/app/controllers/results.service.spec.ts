import { TestBed } from '@angular/core/testing';
import { ResultsService } from './results.service';
import { ResultsModel } from '../models/results/results-model.service';
import { ProtocolModel } from '../models/protocol/protocol-model.service';
import { SqLite } from '../utilities/sqLite.service';
import { DevicesModel } from '../models/devices/devices.service';
import { DiskModel } from '../models/disk/disk.service';
import { FileService } from './file.service';
import { Logger } from '../utilities/logger.service';
import { AppModel } from '../models/app/app.service';
import { protocolDefaults } from '../utilities/defaults';
import { ResultsInterface } from '../models/results/results.interface';
import { DiskInterface } from '../models/disk/disk.interface';

describe('ResultsService', () => {
    let resultsService: ResultsService;

    beforeEach(async () => {
        await TestBed.configureTestingModule({

        })
        resultsService = new ResultsService(
            new ResultsModel,
            new ProtocolModel,
            new SqLite(
                new AppModel, 
                new DiskModel(new Document), 
                new Logger(new DiskModel(new Document))
            ),
            new DevicesModel,
            new DiskModel(new Document),
            new FileService(
                new AppModel,
                new Logger(new DiskModel(new Document))
            ),
            new Logger(new DiskModel(new Document))
        );
    })

    it('initializes exam results', () => {
        let returnedResults: ResultsInterface = resultsService.results;
        expect(returnedResults.currentExam.testDateTime).toBeUndefined();
        expect(returnedResults.currentExam.protocolName).toBe('');
        resultsService.protocol.activeProtocol = resultsService.protocol.loadedProtocols['tabsint-test'];
        resultsService.initializeExamResults();
        expect(returnedResults.currentExam.testDateTime).toBeDefined();
        expect(returnedResults.currentExam.protocolName).toBe('tabsint-test');
    });
    
    it('initializes page results', () => {
        let returnedResults: ResultsInterface = resultsService.results;
        expect(returnedResults.currentPage.pageId).toBe('');
        expect(returnedResults.currentPage.responseArea).toBeUndefined();
        let testCurrentPage = 
        {
         "id": "001",
         "title": "Test",
         "instructionText": "Test Case",
         "responseArea": {
           "type": "test"
           }
        };
        resultsService.initializePageResults(testCurrentPage);
        expect(returnedResults.currentPage.pageId).toBe('001');
        expect(returnedResults.currentPage.responseArea).toBe('test');
    });

    it('pushes current exam results', () => {
        let returnedResults: ResultsInterface = resultsService.results;
        expect(returnedResults.currentExam.responses.length).toEqual(0);
        resultsService.pushResults('test');
        expect(returnedResults.currentExam.responses.length).toEqual(1);
    });
    
})