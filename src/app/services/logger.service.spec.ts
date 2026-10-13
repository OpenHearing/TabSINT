import { TestBed } from '@angular/core/testing';
import { Logger } from './logger.service';
import { DiskModel } from '../models/disk/disk.service';
import { SqLite } from './sqLite.service';
import { BehaviorSubject } from 'rxjs';
import { DiskInterface } from '../models/disk/disk.interface';

const makeDisk = (overrides: Partial<DiskInterface> = {}): DiskInterface =>
  ({
    numLogRows: 0,
    preferences: { disableLogs: false, maxLogRows: 1000 },
    ...overrides,
  }) as DiskInterface;

describe('Logger', () => {
  let logger: Logger;
  let mockDiskModel: jasmine.SpyObj<DiskModel>;
  let mockSqLite: jasmine.SpyObj<SqLite>;
  let disk: DiskInterface;

  beforeEach(() => {
    disk = makeDisk();
    mockDiskModel = jasmine.createSpyObj('DiskModel', ['getDisk']);
    mockDiskModel.diskSubject = new BehaviorSubject<DiskInterface>(disk);
    mockDiskModel.getDisk.and.returnValue(disk);

    mockSqLite = jasmine.createSpyObj('SqLite', ['store', 'deleteOlderLogsIfThereAreTooMany']);

    TestBed.configureTestingModule({
      providers: [Logger, { provide: DiskModel, useValue: mockDiskModel }, { provide: SqLite, useValue: mockSqLite }],
    });

    logger = TestBed.inject(Logger);
  });

  it('should be created', () => {
    expect(logger).toBeTruthy();
  });

  it('debug stores a log entry', () => {
    logger.debug('test message');
    expect(mockSqLite.store).toHaveBeenCalledWith('logs', jasmine.stringContaining('test message'));
  });

  it('warning stores a log entry', () => {
    logger.warning('something wrong');
    expect(mockSqLite.store).toHaveBeenCalledWith('logs', jasmine.stringContaining('something wrong'));
  });

  it('error stores a log entry with the error detail', () => {
    logger.error('failure', new Error('boom'));
    expect(mockSqLite.store).toHaveBeenCalledWith('logs', jasmine.stringContaining('boom'));
  });

  it('does not store when disableLogs is true', () => {
    logger.disk.preferences.disableLogs = true;
    logger.debug('silent');
    expect(mockSqLite.store).not.toHaveBeenCalled();
  });

  it('does not store when numLogRows exceeds maxLogRows', () => {
    logger.disk.numLogRows = 1001;
    logger.disk.preferences.maxLogRows = 1000;
    logger.debug('overflow');
    expect(mockSqLite.store).not.toHaveBeenCalled();
  });

  it('calls deleteOlderLogsIfThereAreTooMany before storing', () => {
    logger.debug('msg');
    expect(mockSqLite.deleteOlderLogsIfThereAreTooMany).toHaveBeenCalledBefore(mockSqLite.store);
  });
});
