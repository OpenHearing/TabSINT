import { Injectable } from '@angular/core';
import { PageInterface } from './page.interface';
import { BehaviorSubject } from 'rxjs/internal/BehaviorSubject';
import { pageInterfaceDefaults } from '../../utilities/defaults';
import { Observable, map } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class PageModel {
  private readonly currentPage: PageInterface = pageInterfaceDefaults;
  private readonly currentPageSubject = new BehaviorSubject<PageInterface>(this.currentPage);

  currentPageObservable: Observable<PageInterface> = this.currentPageSubject.pipe(map(page => structuredClone(page)));

  getPage(): PageInterface {
    return structuredClone(this.currentPageSubject.value);
  }

  /**
   * Update the current page subject.
   * @param page The new page to update the current page subject with.
   */
  updatePage(page: PageInterface): void {
    this.currentPageSubject.next(structuredClone(page));
  }
}
