/* eslint-disable @typescript-eslint/no-explicit-any */
import { TestBed } from '@angular/core/testing';
import { ResultsService } from './results.service';
import { ResultsInterface, ExamResults } from '../models/results/results.interface';
import { DeveloperProtocols } from '../utilities/constants';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { ResultsModel } from '../models/results/results-model.service';
import { DiskModel } from '../models/disk/disk.service';
import { ProtocolModel } from '../models/protocol/protocol-model.service';
import { FileService } from '../services/file.service';
import { Logger } from '../services/logger.service';
import { SqLite } from '../services/sqLite.service';
import { VersionModel } from '../models/version/version.service';
import { DevicesService } from '../services/devices/devices.service';
import { EncryptResultsService } from '../utilities/encrypt-results.service';
import { ResultsUploadService } from './results-upload.service';
import { BehaviorSubject, of } from 'rxjs';
import { ProtocolStack } from '../models/protocol/protocol-stack';
import { ProtocolServer } from '../utilities/constants';
import { DiskInterface } from '../models/disk/disk.interface';
import { ProtocolInterface } from '../models/protocol/protocol.interface';
import { PageInterface } from '../models/page/page.interface';

describe('ResultsService', () => {
  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [
        TranslocoTestingModule.forRoot({ langs: { en: {} }, translocoConfig: { availableLangs: ['en'], defaultLang: 'en' }, preloadLangs: true }),
      ],
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
    const testCurrentPage: PageInterface = {
      _uuid: '001',
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
      page: {
        id: 'test-page',
      },
    });
    expect(returnedResults.currentExam.responses.length).toEqual(1);
  });

  it('records response timing on page results', () => {
    const resultsService = TestBed.inject(ResultsService);
    const returnedResults: ResultsInterface = resultsService.results;
    resultsService.initializePageResults({
      _uuid: '001',
      id: '001',
      title: 'Test',
      instructionText: 'Test Case',
    });
    const startTime = returnedResults.currentPage.responseStartTime;
    expect(startTime).toBeDefined();
    expect(new Date(startTime!).getTime()).not.toBeNaN();
    resultsService.pushResults(returnedResults.currentPage);
    const pushed = returnedResults.currentExam.responses[0];
    expect(pushed.responseStartTime).toBe(startTime);
    expect(pushed.responseElapTimeMS).toBeGreaterThanOrEqual(0);
  });
});

// ── Mocked-dependency tests ────────────────────────────────────────────────

const makeProtocol = (overrides: Partial<ProtocolInterface> = {}): ProtocolInterface =>
  ({
    protocolId: 'p1',
    name: 'MyProtocol',
    date: '',
    version: '1',
    server: ProtocolServer.LocalServer,
    admin: false,
    pages: [],
    resultFilename: 'result',
    publicKey: undefined,
    ...overrides,
  }) as ProtocolInterface;

const makeExamResult = (overrides: Partial<ExamResults> = {}): ExamResults =>
  ({
    testDateTime: '2024-01-01T00:00:00.000Z',
    protocol: makeProtocol(),
    responses: [],
    partialresults: false,
    elapsedTime: '00:01:00',
    exportLocation: ProtocolServer.LocalServer,
    softwareVersion: {} as any,
    tabletLocation: {},
    calibrationVersion: {},
    flags: {},
    hostMetadata: { uuid: 'device-uuid-123456' },
    devices: [],
    ...overrides,
  }) as ExamResults;

describe('ResultsService (mocked)', () => {
  let service: ResultsService;
  let mockResultsModel: jasmine.SpyObj<ResultsModel>;
  let mockDiskModel: jasmine.SpyObj<DiskModel>;
  let mockProtocolModel: jasmine.SpyObj<ProtocolModel>;
  let mockFileService: jasmine.SpyObj<FileService>;
  let mockLogger: jasmine.SpyObj<Logger>;
  let mockSqLite: jasmine.SpyObj<SqLite>;
  let mockVersionModel: { version: object };
  let mockDevicesService: jasmine.SpyObj<DevicesService>;
  let mockEncrypt: jasmine.SpyObj<EncryptResultsService>;
  let mockResultsUploadService: jasmine.SpyObj<ResultsUploadService>;
  let mockDisk: DiskInterface;
  let mockResultsState: ResultsInterface;

  beforeEach(() => {
    const protocol = makeProtocol();
    const protocolStack = new ProtocolStack();
    protocolStack.addProtocol(protocol);

    mockResultsState = {
      currentPage: { pageId: '', page: {} as any },
      currentExam: {
        testDateTime: undefined,
        protocol,
        responses: [],
        partialresults: false,
        elapsedTime: undefined,
        exportLocation: ProtocolServer.LocalServer,
        softwareVersion: {} as any,
        tabletLocation: {},
        calibrationVersion: {},
        flags: {},
        hostMetadata: {},
        devices: [],
      },
    } as unknown as ResultsInterface;

    mockResultsModel = jasmine.createSpyObj('ResultsModel', ['getResults', 'updateCurrentExam', 'updateCurrentPage', 'pushResponse']);
    mockResultsModel.resultsSubject = new BehaviorSubject(mockResultsState);
    mockResultsModel.getResults.and.returnValue(mockResultsState);

    mockDisk = {
      preferences: {
        autoUpload: false,
        server: ProtocolServer.LocalServer,
        servers: { localServer: { resultsDir: 'tabsint-results', resultsDirUri: '' } },
      },
      tabletLocation: {},
    } as unknown as DiskInterface;

    mockDiskModel = jasmine.createSpyObj('DiskModel', ['getDisk', 'updateSummary']);
    mockDiskModel.diskSubject = new BehaviorSubject(mockDisk);
    mockDiskModel.getDisk.and.returnValue(mockDisk);

    mockProtocolModel = jasmine.createSpyObj('ProtocolModel', ['getProtocolModel']);
    mockProtocolModel.getProtocolModel.and.returnValue({
      activeProtocol: protocol,
      activeProtocolStack: protocolStack,
      activeProtocolDictionary: {},
    });

    mockFileService = jasmine.createSpyObj('FileService', ['writeFile']);
    mockFileService.writeFile.and.resolveTo();

    mockLogger = jasmine.createSpyObj('Logger', ['debug', 'error']);

    mockSqLite = jasmine.createSpyObj('SqLite', ['store', 'getAllResultsRaw', 'getSingleResult', 'deleteSingleResult']);
    mockSqLite.store.and.resolveTo();
    mockSqLite.deleteSingleResult.and.resolveTo();

    mockVersionModel = { version: {} };

    mockDevicesService = jasmine.createSpyObj('DevicesService', ['getDeviceOrDefault', 'abortExams', 'queueExam', 'requestResults']);
    (mockDevicesService as any).hostMetadata = of({ uuid: 'device-uuid-123456' });
    (mockDevicesService as any).devices = of([]);

    mockEncrypt = jasmine.createSpyObj('EncryptResultsService', ['encryptForStorage', 'decryptFromStorage', 'encryptForUpload']);

    mockResultsUploadService = jasmine.createSpyObj('ResultsUploadService', ['uploadResult']);
    mockResultsUploadService.uploadResult.and.resolveTo({ success: true, message: 'ok' });

    TestBed.configureTestingModule({
      providers: [
        ResultsService,
        { provide: ResultsModel, useValue: mockResultsModel },
        { provide: DiskModel, useValue: mockDiskModel },
        { provide: ProtocolModel, useValue: mockProtocolModel },
        { provide: FileService, useValue: mockFileService },
        { provide: Logger, useValue: mockLogger },
        { provide: SqLite, useValue: mockSqLite },
        { provide: VersionModel, useValue: mockVersionModel },
        { provide: DevicesService, useValue: mockDevicesService },
        { provide: EncryptResultsService, useValue: mockEncrypt },
        { provide: ResultsUploadService, useValue: mockResultsUploadService },
      ],
    });

    service = TestBed.inject(ResultsService);
  });

  describe('save', () => {
    it('stores plaintext JSON when no publicKey is set', async () => {
      const result = makeExamResult();
      await service.save(result);
      expect(mockSqLite.store).toHaveBeenCalledWith('results', JSON.stringify(result));
      expect(mockEncrypt.encryptForStorage).not.toHaveBeenCalled();
    });

    it('stores encrypted payload when publicKey and uuid are present', async () => {
      service.protocol.activeProtocol!.publicKey = 'PUBKEY';
      service.hostMetadata = { uuid: 'dev-uuid' };
      mockEncrypt.encryptForStorage.and.resolveTo('ENCRYPTED_BLOB');

      const result = makeExamResult({ testDateTime: '2024-01-01T00:00:00.000Z' });
      await service.save(result);

      expect(mockEncrypt.encryptForStorage).toHaveBeenCalled();
      const storedArg = JSON.parse(mockSqLite.store.calls.mostRecent().args[1]);
      expect(storedArg.encrypted).toBe('ENCRYPTED_BLOB');
    });

    it('always calls backup after storing', async () => {
      const result = makeExamResult();
      await service.save(result);
      expect(mockFileService.writeFile).toHaveBeenCalled();
    });

    it('does not auto-export or upload when autoUpload is disabled', async () => {
      mockDisk.preferences.autoUpload = false;
      mockSqLite.getAllResultsRaw.and.resolveTo(['result-json']);

      await service.save(makeExamResult());

      expect(mockSqLite.getAllResultsRaw).not.toHaveBeenCalled();
      expect(mockResultsUploadService.uploadResult).not.toHaveBeenCalled();
      expect(mockSqLite.deleteSingleResult).not.toHaveBeenCalled();
    });

    it('auto-exports the just-saved result to local storage when autoUpload is enabled and server is Local Server', async () => {
      mockDisk.preferences.autoUpload = true;
      mockDisk.preferences.server = ProtocolServer.LocalServer;
      const result = makeExamResult();
      mockSqLite.getAllResultsRaw.and.resolveTo(['a', 'b']);
      mockSqLite.getSingleResult.and.resolveTo([JSON.stringify(result)]);

      await service.save(result);

      expect(mockResultsUploadService.uploadResult).not.toHaveBeenCalled();
      expect(mockFileService.writeFile).toHaveBeenCalled();
      expect(mockSqLite.deleteSingleResult).toHaveBeenCalledWith(1);
    });

    it('auto-uploads the just-saved result to Gitlab when autoUpload is enabled and server is Gitlab', async () => {
      mockDisk.preferences.autoUpload = true;
      mockDisk.preferences.server = ProtocolServer.Gitlab;
      const result = makeExamResult();
      mockSqLite.getAllResultsRaw.and.resolveTo(['a']);

      await service.save(result);

      expect(mockResultsUploadService.uploadResult).toHaveBeenCalledWith(result);
      expect(mockSqLite.deleteSingleResult).toHaveBeenCalledWith(0);
    });

    it('does not delete the result from SQLite when the Gitlab auto-upload fails', async () => {
      mockDisk.preferences.autoUpload = true;
      mockDisk.preferences.server = ProtocolServer.Gitlab;
      mockResultsUploadService.uploadResult.and.resolveTo({ success: false, message: 'network error' });
      mockSqLite.getAllResultsRaw.and.resolveTo(['a']);

      await service.save(makeExamResult());

      expect(mockSqLite.deleteSingleResult).not.toHaveBeenCalled();
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('backup', () => {
    it('writes a file to the backup directory', async () => {
      const result = makeExamResult();
      await service.backup(result);
      const [path] = mockFileService.writeFile.calls.mostRecent().args;
      expect(path).toContain('.tabsint-results-backup/');
      expect(path).toContain('MyProtocol');
    });

    it('logs an error if writeFile throws', async () => {
      mockFileService.writeFile.and.rejectWith(new Error('disk full'));
      await service.backup(makeExamResult());
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('getAllResults', () => {
    it('returns parsed plaintext results', async () => {
      const result = makeExamResult();
      mockSqLite.getAllResultsRaw.and.resolveTo([JSON.stringify(result)]);
      const results = await service.getAllResults();
      expect(results.length).toBe(1);
      expect(results[0].testDateTime).toBe(result.testDateTime);
    });

    it('decrypts encrypted entries when uuid is available', async () => {
      service.hostMetadata = { uuid: 'dev-uuid' };
      const result = makeExamResult();
      const encryptedEntry = JSON.stringify({ testDateTime: result.testDateTime, encrypted: 'BLOB' });
      mockSqLite.getAllResultsRaw.and.resolveTo([encryptedEntry]);
      mockEncrypt.decryptFromStorage.and.resolveTo(JSON.stringify(result));

      const results = await service.getAllResults();
      expect(mockEncrypt.decryptFromStorage).toHaveBeenCalled();
      expect(results.length).toBe(1);
    });

    it('skips encrypted entries when uuid is missing', async () => {
      service.hostMetadata = {};
      const encryptedEntry = JSON.stringify({ testDateTime: '2024-01-01T00:00:00.000Z', encrypted: 'BLOB' });
      mockSqLite.getAllResultsRaw.and.resolveTo([encryptedEntry]);

      const results = await service.getAllResults();
      expect(results.length).toBe(0);
    });

    it('logs an error and skips a malformed entry', async () => {
      mockSqLite.getAllResultsRaw.and.resolveTo(['NOT_JSON']);
      const results = await service.getAllResults();
      expect(results.length).toBe(0);
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('getSingleResult', () => {
    it('returns a parsed plaintext result', async () => {
      const result = makeExamResult();
      mockSqLite.getSingleResult.and.resolveTo([JSON.stringify(result)]);
      const out = await service.getSingleResult(0);
      expect(out!.testDateTime).toBe(result.testDateTime);
    });

    it('returns null and logs on parse error', async () => {
      mockSqLite.getSingleResult.and.resolveTo(['NOT_JSON']);
      const out = await service.getSingleResult(0);
      expect(out).toBeNull();
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('decrypts an encrypted entry', async () => {
      service.hostMetadata = { uuid: 'dev-uuid' };
      const result = makeExamResult();
      mockSqLite.getSingleResult.and.resolveTo([JSON.stringify({ testDateTime: result.testDateTime, encrypted: 'BLOB' })]);
      mockEncrypt.decryptFromStorage.and.resolveTo(JSON.stringify(result));

      const out = await service.getSingleResult(0);
      expect(out!.testDateTime).toBe(result.testDateTime);
    });
  });

  describe('deleteSingleResult', () => {
    it('delegates to sqLite.deleteSingleResult', async () => {
      await service.deleteSingleResult(3);
      expect(mockSqLite.deleteSingleResult).toHaveBeenCalledWith(3);
    });
  });

  describe('exportSingleResult', () => {
    it('writes the result to file and then deletes it from SQLite', async () => {
      const result = makeExamResult();
      mockSqLite.getSingleResult.and.resolveTo([JSON.stringify(result)]);

      await service.exportSingleResult(0);

      expect(mockFileService.writeFile).toHaveBeenCalled();
      expect(mockSqLite.deleteSingleResult).toHaveBeenCalledWith(0);
    });

    it('still deletes from SQLite even when getSingleResult returns null', async () => {
      mockSqLite.getSingleResult.and.resolveTo(['NOT_JSON']);

      await service.exportSingleResult(0);

      expect(mockSqLite.deleteSingleResult).toHaveBeenCalledWith(0);
    });
  });

  describe('writeResultToFile', () => {
    it('writes a .json file when no publicKey is set', async () => {
      const result = makeExamResult();
      await service.writeResultToFile(result);
      const [path] = mockFileService.writeFile.calls.mostRecent().args;
      expect(path).toContain('.json');
      expect(mockDiskModel.updateSummary).toHaveBeenCalledWith(result);
    });

    it('writes .json.enc and .json.key.enc files when publicKey is set', async () => {
      service.protocol.activeProtocol!.publicKey = 'PUBKEY';
      service.hostMetadata = { uuid: 'dev-uuid' };
      mockEncrypt.encryptForUpload.and.resolveTo(['ENC_DATA', 'ENC_KEY']);

      const result = makeExamResult({ testDateTime: '2024-01-01T00:00:00.000Z' });
      await service.writeResultToFile(result);

      const paths = mockFileService.writeFile.calls.allArgs().map(a => a[0]);
      expect(paths.some((p: string) => p.endsWith('.json.enc'))).toBeTrue();
      expect(paths.some((p: string) => p.endsWith('.json.key.enc'))).toBeTrue();
    });
  });
});
