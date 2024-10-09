import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';

import { ResultsInterface } from '../../../../models/results/results.interface';
import { PageInterface } from '../../../../models/page/page.interface';
import { TextBoxResultViewerInterface } from './textbox-result-viewer.interface';

import { ResultsModel } from '../../../../models/results/results-model.service';
import { PageModel } from '../../../../models/page/page.service';

@Component({
  selector: 'textbox-result-viewer-view',
  templateUrl: './textbox-result-viewer.component.html'
})
export class TextboxResultViewerComponent implements OnInit, OnDestroy {
  currentPage: PageInterface;
  results: ResultsInterface;
  response: string = '';
  pageSubscription: Subscription | undefined;

  constructor (
    private readonly resultsModel: ResultsModel, 
    private readonly pageModel: PageModel
  ) {
    this.results = this.resultsModel.getResults();
    this.currentPage = this.pageModel.getPage();
    
  }
  
  ngOnInit() {
    this.pageSubscription = this.pageModel.currentPageSubject.subscribe( (updatedPage: PageInterface) => {
      if (updatedPage.responseArea?.type === "textboxResponseAreaResultViewer") {
        const textboxResponseAreaResultViewer = updatedPage.responseArea as TextBoxResultViewerInterface;
        let reverseResponses = [...this.results.currentExam.responses].reverse();
        let findResultOfPageIdToDisplay = ( response: {pageId: string} ) => 
          response.pageId === textboxResponseAreaResultViewer.pageIdToDisplay        
        this.response = reverseResponses.find(findResultOfPageIdToDisplay).response;
      }
    });
  }

  ngOnDestroy() {
    this.pageSubscription?.unsubscribe();
  }

}
