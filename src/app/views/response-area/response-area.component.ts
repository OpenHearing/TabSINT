import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { PageInterface } from '../../models/page/page.interface';
import { PageModel } from '../../models/page/page.service';

@Component({
  selector: 'response-area',
  templateUrl: './response-area.component.html',
  template: 'response-area',
  styleUrl: './response-area.component.css'
})
export class ResponseAreaComponent implements OnInit, OnDestroy {
  pageSubscription: Subscription | undefined;
  currentPage: PageInterface;

  constructor (private readonly pageModel: PageModel) {
    this.currentPage = pageModel.getPage();
  }

  ngOnInit() {
    this.pageSubscription = this.pageModel.currentPageSubject.subscribe( (updatedPage: PageInterface) => {
      this.currentPage = updatedPage;
    });
  }

  ngOnDestroy() {
    this.pageSubscription?.unsubscribe();
  }
}
