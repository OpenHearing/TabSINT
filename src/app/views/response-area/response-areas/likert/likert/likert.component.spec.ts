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

  it('should normalize the flat form into per-question labels', fakeAsync(() => {
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
    tick();
    fixture.detectChanges();

    expect(component.questions.length).toEqual(2);
    // A length-2 labels array becomes end labels above the scale (levels === 5).
    expect(component.questions[0].levels).toEqual(5);
    expect(component.questions[0].topLabels[0]).toEqual('Strongly Disagree');
    expect(component.questions[0].topLabels[4]).toEqual('Strongly Agree');
    expect(component.hasLabels(component.questions[0].bottomLabels)).toBeFalse();
  }));

  it('should emit response change when onResponseChange is called', () => {
    spyOn(component.responseChange, 'emit');
    resultsModel.resultsModel.currentPage.response = [0];
    component.onResponseChange(0, 2);
    expect(resultsModel.resultsModel.currentPage.response[0]).toEqual(2);
    expect(component.responseChange.emit).toHaveBeenCalledWith(resultsModel.resultsModel.currentPage.response);
  });

  it('should honor per-question overrides and below-positioned labels', fakeAsync(() => {
    const updatedPage = {
      responseArea: {
        type: 'likertResponseArea',
        levels: 5,
        position: 'below',
        labels: ['Never', 'Always'],
        questions: [{ text: 'Percent', levels: 11, labels: ['0%', '100%'] }, 'Plain question'],
      },
      id: 'page2',
    };

    mockPageModel.updatePage(updatedPage);
    tick();
    fixture.detectChanges();

    expect(component.questions.length).toEqual(2);
    // Per-question override wins: 11 levels with end labels below.
    expect(component.questions[0].levels).toEqual(11);
    expect(component.questions[0].bottomLabels[0]).toEqual('0%');
    expect(component.questions[0].bottomLabels[10]).toEqual('100%');
    // Second question falls back to response-area defaults.
    expect(component.questions[1].levels).toEqual(5);
    expect(component.questions[1].bottomLabels[0]).toEqual('Never');
    expect(component.questions[1].bottomLabels[4]).toEqual('Always');
  }));
});
