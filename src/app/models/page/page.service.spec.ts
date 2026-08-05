import { TestBed } from '@angular/core/testing';
import { PageModel } from './page.service';
import { PageInterface } from './page.interface';

const makePage = (overrides: Partial<PageInterface> = {}): PageInterface => ({ _uuid: 'test', id: 'test-page', title: 'Test', ...overrides });

describe('PageModel', () => {
  let pageModel: PageModel;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [PageModel] });
    pageModel = TestBed.inject(PageModel);
  });

  it('getPage returns a defined page', () => {
    expect(pageModel.getPage()).toBeDefined();
  });

  it('updatePage stores the new page', () => {
    const page = makePage({ id: 'new-page' });
    pageModel.updatePage(page);
    expect(pageModel.getPage().id).toBe('new-page');
  });

  it('getPage returns a clone — mutations do not affect internal state', () => {
    const page = makePage({ id: 'original' });
    pageModel.updatePage(page);
    const retrieved = pageModel.getPage();
    retrieved.id = 'mutated';
    expect(pageModel.getPage().id).toBe('original');
  });

  it('observable emits when page is updated', done => {
    const page = makePage({ id: 'observable-test' });
    pageModel.currentPageObservable.subscribe(emitted => {
      if (emitted.id === 'observable-test') {
        expect(emitted.id).toBe('observable-test');
        done();
      }
    });
    pageModel.updatePage(page);
  });
});
