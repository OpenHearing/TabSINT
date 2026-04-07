import { TestBed } from '@angular/core/testing';
import { ResultsService } from './results.service';
import { ResultsInterface } from '../models/results/results.interface';
import { DeveloperProtocols } from '../utilities/constants';
import { TranslocoTestingModule } from '@jsverse/transloco';

describe('ResultsService', () => {
  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [ResultsService],
    });
  });

  it('initializes exam results', () => {
    const resultsService = TestBed.inject(ResultsService);
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
    const resultsService = TestBed.inject(ResultsService);
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
    const resultsService = TestBed.inject(ResultsService);
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
