import { Component } from '@angular/core';
import { ResultsInterface } from '../../../../models/results/results.interface';
import { ResultsModel } from '../../../../models/results/results-model.service';
import { PageModel } from '../../../../models/page/page.service';
import { PageInterface } from '../../../../models/page/page.interface';
import { TextBoxResultViewerInterface } from './textbox-result-viewer.interface';

@Component({
  selector: 'textbox-result-viewer-view',
  templateUrl: './textbox-result-viewer.component.html'
})
export class TextboxResultViewerComponent {
  currentPage: PageInterface;
  results: ResultsInterface;
  response: string = '';

  constructor (
    private readonly resultsModel: ResultsModel, 
    private readonly pageModel: PageModel
  ) {
    this.results = this.resultsModel.getResults();
    this.currentPage = this.pageModel.getPage();
    
    if (this.currentPage.responseArea?.type === "textboxResponseAreaResultViewer") {
      const textboxResponseAreaResultViewer = this.currentPage.responseArea as TextBoxResultViewerInterface;
      this.response = this.results.currentExam.responses.find( (response: {pageId: string}) => response.pageId === textboxResponseAreaResultViewer.pageIdToDisplay).response;
      
    }
  }
}
