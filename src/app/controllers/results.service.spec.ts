import { TestBed } from '@angular/core/testing';
import { ResultsService } from './results.service';
import { ResultsModel } from '../models/results/results-model.service';
import { ProtocolModel } from '../models/protocol/protocol-model.service';
import { SqLite } from '../services/sqLite.service';
import { DevicesModel } from '../models/devices/devices-model.service';
import { DiskModel } from '../models/disk/disk.service';
import { FileService } from '../services/file.service';
import { Logger } from '../services/logger.service';
import { AppModel } from '../models/app/app.service';
import { ResultsInterface } from '../models/results/results.interface';
import { DeveloperProtocols } from '../utilities/constants';
import { VersionModel } from '../models/version/version.service';

describe('ResultsService', () => {
  let resultsService: ResultsService;
  const appModel = new AppModel();
  const diskModel = new DiskModel(new Document());
  const sqLite = new SqLite(appModel, diskModel);
  const logger = new Logger(diskModel, sqLite);
  const version = new VersionModel(logger);

  beforeEach(async () => {
    TestBed.configureTestingModule({});

    resultsService = new ResultsService(
      new DevicesModel(logger),
      diskModel,
      new FileService(appModel, logger, diskModel),
      logger,
      new ProtocolModel(),
      new ResultsModel(new DevicesModel(logger), version, logger),
      sqLite,
      version
    );
  });

  it('initializes exam results', () => {
    const returnedResults: ResultsInterface = resultsService.results;
    expect(returnedResults.currentExam.testDateTime).toBeUndefined();
    expect(returnedResults.currentExam.protocol.name).toBe('');
    resultsService.protocol.activeProtocol = {
      ...resultsService.disk.availableProtocolsMeta['develop'],
      ...DeveloperProtocols['develop'],
    };
    resultsService.initializeExamResults();
    expect(returnedResults.currentExam.testDateTime).toBeDefined();
    expect(returnedResults.currentExam.protocol.name).toBe('develop');
  });

  it('initializes page results', () => {
    const returnedResults: ResultsInterface = resultsService.results;
    expect(returnedResults.currentPage.pageId).toBe('');
    expect(returnedResults.currentPage.responseArea).toBeUndefined();
    const testCurrentPage = {
      id: '001',
      title: 'Test',
      instructionText: 'Test Case',
      responseArea: {
        type: 'test',
      },
    };
    resultsService.initializePageResults(testCurrentPage);
    expect(returnedResults.currentPage.pageId).toBe('001');
    expect(returnedResults.currentPage.responseArea).toBe('test');
  });

  it('pushes current exam results', () => {
    const returnedResults: ResultsInterface = resultsService.results;
    expect(returnedResults.currentExam.responses.length).toEqual(0);
    resultsService.pushResults({
      pageId: '01',
      response: 'test',
      page: {},
    });
    expect(returnedResults.currentExam.responses.length).toEqual(1);
  });
});
