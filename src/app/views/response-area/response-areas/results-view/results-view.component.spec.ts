import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResultsViewComponent } from './results-view.component';
import { PageModel } from '../../../../models/page/page.service';
import { ResultsModel } from '../../../../models/results/results-model.service';
import { CurrentResults } from '../../../../models/results/results.interface';
import { PageInterface } from '../../../../models/page/page.interface';

describe('ResultsViewComponent', () => {
  let component: ResultsViewComponent;
  let fixture: ComponentFixture<ResultsViewComponent>;
  let pageModel: PageModel;
  let resultsModel: ResultsModel;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ResultsViewComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ResultsViewComponent);
    component = fixture.componentInstance;
    pageModel = TestBed.inject(PageModel);
    resultsModel = TestBed.inject(ResultsModel);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('shows only the responses listed in pageIdsToDisplay, in the order they occurred', () => {
    const responses: CurrentResults[] = [
      { pageId: 'a', responseArea: 'textboxResponseArea', response: 'first', page: {} },
      { pageId: 'b', responseArea: 'textboxResponseArea', response: 'skip me', page: {} },
      { pageId: 'c', responseArea: 'textboxResponseArea', response: 'second', page: {} },
    ];
    resultsModel.getResults().currentExam.responses = responses;

    pageModel.updatePage({
      responseArea: { type: 'resultsViewResponseArea', pageIdsToDisplay: ['a', 'c'] },
    } as PageInterface);

    expect(component.matchedResults?.map(r => r.pageId)).toEqual(['a', 'c']);
  });

  it('ignores page updates for other response-area types', () => {
    resultsModel.getResults().currentExam.responses = [{ pageId: 'a', response: 'x', page: {} }];

    pageModel.updatePage({ responseArea: { type: 'textboxResponseArea' } } as PageInterface);

    expect(component.matchedResults).toBeUndefined();
  });
});
