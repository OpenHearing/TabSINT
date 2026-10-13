import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { PageInterface } from '../../models/page/page.interface';
import { PageModel } from '../../models/page/page.service';

@Component({
  selector: 'app-response-area',
  templateUrl: './response-area.component.html',
  // template: 'response-area',
  styleUrl: './response-area.component.css',
})
export class ResponseAreaComponent implements OnInit, OnDestroy {
  private readonly pageModel = inject(PageModel);

  pageSubscription: Subscription | undefined;
  currentPage: PageInterface;
  renderKey: string | null = null;

  constructor() {
    this.currentPage = this.pageModel.getPage();
  }

  /**
   * Force a page reload.
   * This is needed to ensure re-initialization for response areas of the same type run back-to-back.
   */
  reloadPage() {
    const id = this.currentPage._uuid;
    this.renderKey = null;

    setTimeout(() => {
      this.renderKey = id;
    });
  }

  ngOnInit(): void {
    this.pageSubscription = this.pageModel.currentPageObservable.subscribe((updatedPage: PageInterface) => {
      this.currentPage = updatedPage;
      if (this.renderKey !== updatedPage._uuid) {
        this.reloadPage();
      }
    });
  }

  ngOnDestroy(): void {
    this.pageSubscription?.unsubscribe();
  }
}
