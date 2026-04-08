import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';

import { LikertComponent } from './likert.component';
import { ResultsModel } from '../../../../../models/results/results-model.service';
import { PageModel } from '../../../../../models/page/page.service';
import { StateModel } from '../../../../../models/state/state.service';
import { TranslocoTestingModule } from '@jsverse/transloco';

describe('LikertComponent', () => {
  let component: LikertComponent;
  let fixture: ComponentFixture<LikertComponent>;
  let mockPageModel: PageModel;
  let resultsModel: ResultsModel;

  beforeEach(async () => {
    mockPageModel = new PageModel();
    mockPageModel.updatePage({
      responseArea: {
        type: 'likertResponseArea',
        questions: ['Question 1', 'Question 2'],
        levels: 5,
        position: 'above',
        labels: ['Strongly Disagree', 'Strongly Agree'],
        useEmoticons: false,
      },
      id: 'page1',
    });

    await TestBed.configureTestingModule({
      declarations: [LikertComponent],
      imports: [
        TranslocoTestingModule.forRoot({ langs: { en: {} }, translocoConfig: { availableLangs: ['en'], defaultLang: 'en' }, preloadLangs: true }),
      ],
      providers: [ResultsModel, StateModel, { provide: PageModel, useValue: mockPageModel }],
    }).compileComponents();

    fixture = TestBed.createComponent(LikertComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    resultsModel = TestBed.inject(ResultsModel);
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
    resultsModel.resultsModel.currentPage.response = [0];
    component.onResponseChange(0, 2);
    expect(resultsModel.resultsModel.currentPage.response[0]).toEqual(2);
    expect(component.responseChange.emit).toHaveBeenCalledWith(resultsModel.resultsModel.currentPage.response);
  });

  it('should subscribe to pageModel currentPageObservable and update questions', fakeAsync(() => {
    const updatedPage = {
      responseArea: {
        type: 'likertResponseArea',
        questions: ['Updated Question 1', 'Updated Question 2'],
        levels: 7,
        position: 'below',
        labels: ['Never', 'Always'],
        useEmoticons: true,
      },
      id: 'page2',
    };

    mockPageModel.updatePage(updatedPage);
    tick();
    fixture.detectChanges();

    expect(component.questions).toEqual(['Updated Question 1', 'Updated Question 2']);
    expect(component.levels).toEqual(7);
    expect(component.labels).toEqual(['Never', 'Always']);
    expect(component.useEmoticons).toBeTrue();
  }));
});
