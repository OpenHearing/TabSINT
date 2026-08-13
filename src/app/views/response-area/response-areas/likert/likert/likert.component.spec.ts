import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';

import { LikertComponent } from './likert.component';
import { ResultsModel } from '../../../../../models/results/results-model.service';
import { PageModel } from '../../../../../models/page/page.service';
import { StateModel } from '../../../../../models/state/state.service';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { PageInterface } from '../../../../../models/page/page.interface';
import { ExamService } from '../../../../../controllers/exam.service';

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
      _uuid: 'page1',
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
      _uuid: 'page1',
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

  it('should defer autoSubmit so the completing answer renders before the page advances', fakeAsync(() => {
    const examService = TestBed.inject(ExamService);
    spyOn(examService, 'submit');
    component.likertExamProperties.autoSubmit = true;
    resultsModel.resultsModel.currentPage.response = [0, null];

    // Answering the last remaining question should not submit synchronously -- the caller (and
    // Angular's change detection) must get a chance to render this selection first.
    component.onResponseChange(1, 3);
    expect(examService.submit).not.toHaveBeenCalled();

    tick(300);
    expect(examService.submit).toHaveBeenCalledTimes(1);
  }));

  it('should not autoSubmit while any question is still unanswered', fakeAsync(() => {
    const examService = TestBed.inject(ExamService);
    spyOn(examService, 'submit');
    component.likertExamProperties.autoSubmit = true;
    resultsModel.resultsModel.currentPage.response = [null, null];

    component.onResponseChange(0, 1);
    tick(300);
    expect(examService.submit).not.toHaveBeenCalled();
  }));

  it('should honor per-question overrides and below-positioned labels', fakeAsync(() => {
    const updatedPage: PageInterface = {
      responseArea: {
        type: 'likertResponseArea',
        levels: 5,
        position: 'below',
        labels: ['Never', 'Always'],
        questions: [{ text: 'Percent', levels: 11, labels: ['0%', '100%'] }, 'Plain question'],
      },
      _uuid: 'page2',
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

  it('should show labels and specifiers at the same time on opposite sides', fakeAsync(() => {
    mockPageModel.updatePage({
      responseArea: {
        type: 'likertResponseArea',
        levels: 11,
        useRadioButtons: true,
        // Numbers below via labels...
        labels: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
        position: 'below',
        // ...and descriptive end labels above via specifiers.
        specifiers: [
          { level: 0, label: 'No, Not a problem', position: 'above' },
          { level: 10, label: 'Yes, a very big problem', position: 'above' },
        ],
        verticalSpacing: 40,
        questions: ['Tinnitus kept me from sleeping.'],
      },
      _uuid: 'page3',
      id: 'page3',
    });
    tick();
    fixture.detectChanges();

    const q = component.questions[0];
    // Specifiers rendered above.
    expect(q.topLabels[0]).toEqual('No, Not a problem');
    expect(q.topLabels[10]).toEqual('Yes, a very big problem');
    // Labels rendered below (per-level, length === levels).
    expect(q.bottomLabels[0]).toEqual('0');
    expect(q.bottomLabels[5]).toEqual('5');
    expect(q.bottomLabels[10]).toEqual('10');
    expect(component.verticalSpacing).toEqual(40);

    // Sparse (2-end) top labels: each anchored to its own edge, sharing the full row between them.
    expect(q.topLabelSlots.length).toEqual(2);
    expect(q.topLabelSlots[0]).toEqual(jasmine.objectContaining({ label: 'No, Not a problem', align: 'left' }));
    expect(q.topLabelSlots[1]).toEqual(jasmine.objectContaining({ label: 'Yes, a very big problem', align: 'right' }));
    expect(q.topLabelSlots[0].flexGrow + q.topLabelSlots[1].flexGrow).toEqual(11);

    // Dense (every level) bottom labels: every slot gets an equal, single-level share, and every
    // slot -- including the first and last, which have no neighbor but also no extra room -- is
    // centered over its own button just like the interior ones.
    expect(q.bottomLabelSlots.length).toEqual(11);
    expect(q.bottomLabelSlots.every(slot => slot.flexGrow === 1)).toBeTrue();
    expect(q.bottomLabelSlots.every(slot => slot.align === 'center')).toBeTrue();
  }));

  it('should center a labeled midpoint between two anchored end labels', fakeAsync(() => {
    mockPageModel.updatePage({
      responseArea: {
        type: 'likertResponseArea',
        levels: 11,
        specifiers: [
          { level: 0, label: '0%', position: 'below' },
          { level: 5, label: '50%', position: 'below' },
          { level: 10, label: '100%', position: 'below' },
        ],
        questions: ['Question'],
      },
      _uuid: 'page4',
      id: 'page4',
    });
    tick();
    fixture.detectChanges();

    const slots = component.questions[0].bottomLabelSlots;
    expect(slots.length).toEqual(3);
    expect(slots[0]).toEqual(jasmine.objectContaining({ label: '0%', align: 'left' }));
    expect(slots[1]).toEqual(jasmine.objectContaining({ label: '50%', align: 'center' }));
    expect(slots[2]).toEqual(jasmine.objectContaining({ label: '100%', align: 'right' }));
    // Halfway between level 0 and level 5 to halfway between level 5 and level 10 == 5 level-widths.
    expect(slots[1].flexGrow).toEqual(5);
  }));
});
