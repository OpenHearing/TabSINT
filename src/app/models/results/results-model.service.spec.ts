import { TestBed } from '@angular/core/testing';
import { ResultsModel } from './results-model.service';
import { VersionModel } from '../version/version.service';
import { Logger } from '../../services/logger.service';

describe('ResultsModel', () => {
  let resultsModel: ResultsModel;
  let loggerSpy: jasmine.SpyObj<Logger>;

  beforeEach(() => {
    loggerSpy = jasmine.createSpyObj('Logger', ['debug', 'warning', 'error']);

    TestBed.configureTestingModule({
      providers: [
        ResultsModel,
        { provide: Logger, useValue: loggerSpy },
        { provide: VersionModel, useValue: { version: {} } },
      ],
    });
    resultsModel = TestBed.inject(ResultsModel);
  });

  it('getResults returns the results model', () => {
    expect(resultsModel.getResults()).toBeDefined();
  });

  it('updateCurrentPage merges partial updates', () => {
    resultsModel.updateCurrentPage({ pageId: 'page-1' });
    expect(resultsModel.getResults().currentPage.pageId).toBe('page-1');
  });

  it('updateCurrentExam merges partial updates', () => {
    resultsModel.updateCurrentExam({ testDateTime: '2024-01-01' });
    expect(resultsModel.getResults().currentExam.testDateTime).toBe('2024-01-01');
  });

  it('pushResponse appends to responses array', () => {
    resultsModel.pushResponse({ value: 1 });
    resultsModel.pushResponse({ value: 2 });
    expect(resultsModel.getResults().currentExam.responses.length).toBe(2);
  });

  describe('updateCurrentPageResponseElement', () => {
    it('updates the element at the given index when response is an array', () => {
      resultsModel.updateCurrentPage({ response: ['a', 'b', 'c'] });
      resultsModel.updateCurrentPageResponseElement(1, 'updated');
      expect(resultsModel.getResults().currentPage.response[1]).toBe('updated');
    });

    it('logs a warning when response is not an array', () => {
      resultsModel.updateCurrentPage({ response: 'not-an-array' });
      resultsModel.updateCurrentPageResponseElement(0, 'value');
      expect(loggerSpy.warning).toHaveBeenCalled();
    });
  });

  it('emits via resultsSubject when updated', (done) => {
    resultsModel.resultsSubject.subscribe(results => {
      if (results.currentPage.pageId === 'emitted') {
        expect(results.currentPage.pageId).toBe('emitted');
        done();
      }
    });
    resultsModel.updateCurrentPage({ pageId: 'emitted' });
  });
});
