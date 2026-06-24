import { TestBed } from '@angular/core/testing';
import { Logger } from './logger.service';
import { GitlabService } from './gitlab.service';
import { FileService } from './file.service';

describe('GitlabService', () => {
  let gitlabService: GitlabService;
  let mockFileService: jasmine.SpyObj<FileService>;
  let mockLogger: jasmine.SpyObj<Logger>;

  beforeEach(() => {
    mockFileService = jasmine.createSpyObj('FileService', ['dummyMethod']);
    mockLogger = jasmine.createSpyObj('Logger', ['dummyMethod']);

    TestBed.configureTestingModule({
      providers: [GitlabService, { provide: FileService, useValue: mockFileService }, { provide: Logger, useValue: mockLogger }],
    });

    gitlabService = TestBed.inject(GitlabService);
  });

  it('should be created', () => {
    expect(gitlabService).toBeTruthy();
  });
});
