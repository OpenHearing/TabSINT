import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';

import { LikertComponent } from './likert.component';
import { ResultsModel } from '../../../../../models/results/results-model.service';
import { DiskModel } from '../../../../../models/disk/disk.service';
import { SqLite } from '../../../../../services/sqLite.service';
import { AppModel } from '../../../../../models/app/app.service';
import { Logger } from '../../../../../services/logger.service';
import { VersionModel } from '../../../../../models/version/version.service';
import { ExamService } from '../../../../../controllers/exam.service';
import { ProtocolModel } from '../../../../../models/protocol/protocol-model.service';
import { ProtocolSchemaInterface } from '../../../../../interfaces/protocol-schema.interface';

describe('LikertComponent', () => {
  let component: LikertComponent;
  let fixture: ComponentFixture<LikertComponent>;
  let mockResultsModel: ResultsModel;
  let mockExamService: jasmine.SpyObj<ExamService>;
  let mockProtocolModel: ProtocolModel;
  const appModel = new AppModel();
  const diskModel = new DiskModel(new Document());
  const sqLite = new SqLite(appModel, diskModel);
  const logger = new Logger(diskModel, sqLite);
  const version = new VersionModel(logger);

  beforeEach(async () => {
    mockResultsModel = new ResultsModel(version, logger);
    mockProtocolModel = new ProtocolModel();
    mockProtocolModel.protocolModel.activeProtocolStack.addProtocol({
      pages: [
        {
          responseArea: {
            type: 'likertResponseArea',
            questions: ['Question 1', 'Question 2'],
            levels: 5,
            position: 'above',
            labels: ['Strongly Disagree', 'Strongly Agree'],
            useEmoticons: false,
          },
          id: 'page1',
        },
      ],
    } as ProtocolSchemaInterface);
    mockExamService = jasmine.createSpyObj('ExamService', ['_dummyMethod'], {
      currentPageObservable: mockProtocolModel.protocolModel.activeProtocolStack.currentPageObservable,
    });

    await TestBed.configureTestingModule({
      declarations: [LikertComponent],
      providers: [
        { provide: ResultsModel, useValue: mockResultsModel },
        { provide: ProtocolModel, useValue: mockProtocolModel },
        { provide: ExamService, useValue: mockExamService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LikertComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
  it('should initialize with mocked questions, labels, and levels', () => {
    expect(component.questions).toEqual([]);
    expect(component.labels).toEqual([]);
    expect(component.levels).toEqual(10);
  });

  it('should emit response change when onResponseChange is called', () => {
    spyOn(component.responseChange, 'emit');
    mockResultsModel.resultsModel.currentPage.response = [0];
    component.onResponseChange(0, 2);
    expect(mockResultsModel.resultsModel.currentPage.response[0]).toEqual(2);
    expect(component.responseChange.emit).toHaveBeenCalledWith(mockResultsModel.resultsModel.currentPage.response);
  });

  it('should subscribe to pageModel currentPageObservable and update questions', fakeAsync(() => {
    mockProtocolModel.protocolModel.activeProtocolStack.addProtocol({
      pages: [
        {
          responseArea: {
            type: 'likertResponseArea',
            questions: ['Updated Question 1', 'Updated Question 2'],
            levels: 7,
            position: 'below',
            labels: ['Never', 'Always'],
            useEmoticons: true,
          },
          id: 'page2',
        },
      ],
    } as ProtocolSchemaInterface);
    tick();
    fixture.detectChanges();

    expect(component.questions).toEqual(['Updated Question 1', 'Updated Question 2']);
    expect(component.levels).toEqual(7);
    expect(component.labels).toEqual(['Never', 'Always']);
    expect(component.useEmoticons).toBeTrue();
  }));
});
