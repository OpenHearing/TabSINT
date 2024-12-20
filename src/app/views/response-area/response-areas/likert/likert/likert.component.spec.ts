import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BehaviorSubject, of } from 'rxjs';

import { LikertComponent } from './likert.component';
import { ResultsModel } from '../../../../../models/results/results-model.service';
import { PageModel } from '../../../../../models/page/page.service';
import { DiskModel } from '../../../../../models/disk/disk.service';
import { SqLite } from '../../../../../utilities/sqLite.service';
import { AppModel } from '../../../../../models/app/app.service';
import { Logger } from '../../../../../utilities/logger.service';
import { DevicesModel } from '../../../../../models/devices/devices-model.service';
import { VersionModel } from '../../../../../models/version/version.service';

describe('LikertComponent', () => {
  let component: LikertComponent;
  let fixture: ComponentFixture<LikertComponent>;
  let mockResultsModel: ResultsModel;
  let mockPageModel: PageModel;
  let appModel = new AppModel;
  let diskModel = new DiskModel(new Document);
  let sqLite = new SqLite(appModel, diskModel);
  let logger = new Logger(diskModel, sqLite);
  let devices: DevicesModel;
  let version = new VersionModel(logger);
  

  beforeEach(async () => {
    devices = new DevicesModel(logger);
    mockResultsModel = new ResultsModel(
      devices,
      version
    );

    mockPageModel = new PageModel();
    mockPageModel.currentPage = {
      responseArea: {
        type: 'likertResponseArea',
        questions: ['Question 1', 'Question 2'],
        levels: 5,
        position: 'above',
        labels: ['Strongly Disagree', 'Strongly Agree'],
        useEmoticons: false
      },
      id: 'page1'
    };
    mockPageModel.currentPageSubject = new BehaviorSubject(mockPageModel.currentPage);

    await TestBed.configureTestingModule({
      declarations: [LikertComponent],
      providers: [
        { provide: ResultsModel, useValue: mockResultsModel },
        { provide: PageModel, useValue: mockPageModel }
      ]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(LikertComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
  it('should initialize with mocked questions, labels, and levels', () => {
    expect(component.questions).toEqual(['Question 1', 'Question 2']);
    expect(component.labels).toEqual(['Strongly Disagree', 'Strongly Agree']);
    expect(component.levels).toEqual(5);
  });

  it('should emit response change when onResponseChange is called', () => {
    spyOn(component.responseChange, 'emit');
    component.onResponseChange(0, 2);
    expect(mockResultsModel.resultsModel.currentPage.response[0]).toEqual(2);
    expect(component.responseChange.emit).toHaveBeenCalledWith(mockResultsModel.resultsModel.currentPage.response);
  });

  it('should subscribe to pageModel currentPageSubject and update questions', () => {
    const updatedPage = {
      responseArea: {
        type: 'likertResponseArea',
        questions: ['Updated Question 1', 'Updated Question 2'],
        levels: 7,
        position: 'below',
        labels: ['Never', 'Always'],
        useEmoticons: true
      },
      id: 'page2'
    };

    mockPageModel.currentPageSubject.next(updatedPage);
    fixture.detectChanges();

    expect(component.questions).toEqual(['Updated Question 1', 'Updated Question 2']);
    expect(component.levels).toEqual(7);
    expect(component.labels).toEqual(['Never', 'Always']);
    expect(component.useEmoticons).toBeTrue();
  });
});
