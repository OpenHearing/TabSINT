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

  constructor() {
    this.currentPage = this.pageModel.getPage();
  }

  ngOnInit(): void {
    this.pageSubscription = this.pageModel.currentPageObservable.subscribe((updatedPage: PageInterface) => {
      this.currentPage = updatedPage;
    });
  }

  ngOnDestroy(): void {
    this.pageSubscription?.unsubscribe();
  }
}
