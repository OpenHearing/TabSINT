import { Component, OnDestroy, OnInit } from '@angular/core';
import { ResultsInterface } from '../../../../models/results/results.interface';
import { ResultsModel } from '../../../../models/results/results-model.service';
import { PageModel } from '../../../../models/page/page.service';
import { PageInterface } from '../../../../models/page/page.interface';
import { TextBoxInterface } from './textbox.interface';
import { Subscription } from 'rxjs';

@Component({
  selector: 'textbox-view',
  templateUrl: './textbox.component.html',
  styleUrl: './textbox.component.css'
})
export class TextboxComponent implements OnInit, OnDestroy {
  currentPage: PageInterface;
  results: ResultsInterface;
  rows: number;
  pageSubscription: Subscription | undefined;

  constructor (
    private readonly resultsModel: ResultsModel, 
    private readonly pageModel: PageModel
  ) {
    this.results = this.resultsModel.getResults();
    this.currentPage = this.pageModel.getPage();
    this.rows = (this.currentPage.responseArea as TextBoxInterface).rows!; 
  }

  ngOnInit() {
    this.pageSubscription = this.pageModel.currentPageSubject.subscribe( (updatedPage: PageInterface) => {
      if (updatedPage?.responseArea?.type == "textboxResponseArea") {
        const updatedTextboxResponseArea = updatedPage.responseArea as TextBoxInterface;
        if (updatedTextboxResponseArea) {
          this.rows = updatedTextboxResponseArea?.rows;
        }
      }
    });
  }

  ngOnDestroy() {
    this.pageSubscription?.unsubscribe();
  }

}
