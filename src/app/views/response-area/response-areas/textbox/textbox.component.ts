import { Component } from '@angular/core';

import { ExamService } from '../../../../controllers/exam.service';
import { ResultsInterface } from '../../../../models/results/results.interface';
import { ResultsModel } from '../../../../models/results/results-model.service';
import { ProtocolModel } from '../../../../models/protocol/protocol-model.service';
import { ProtocolModelInterface } from '../../../../models/protocol/protocol.interface';
import { StateInterface } from '../../../../models/state/state.interface';
import { StateModel } from '../../../../models/state/state.service';
import { Observable } from 'rxjs/internal/Observable';
import { PageModel } from '../../../../models/page/page.service';
import { PageInterface } from '../../../../models/page/page.interface';
import { TextBoxInterface } from './textbox.interface';

@Component({
  selector: 'textbox-view',
  templateUrl: './textbox.component.html',
  styleUrl: './textbox.component.css'
})
export class TextboxComponent {
  currentPage: PageInterface;
  results: ResultsInterface;
  protocol: ProtocolModelInterface;
  state: StateInterface
  rows: number;
  observableVar: any;

  constructor (public resultsModel: ResultsModel, public pageModel: PageModel, public protocolModel: ProtocolModel, public stateModel: StateModel) {
    this.results = this.resultsModel.getResults();
    this.protocol = this.protocolModel.getProtocolModel();
    this.state = this.stateModel.getState();
    this.currentPage = this.pageModel.getPage();

    this.rows = (this.currentPage.responseArea as TextBoxInterface).rows!;
    this.observableVar = this.pageModel.currentPageObservable;

    this.observableVar.subscribe( (updatedPage:any) => {
      // TODO: This ternary might not be needed. Should the exam service send the default value if one is not specified?
        this.rows = updatedPage?.responseArea?.rows ? updatedPage?.responseArea?.rows : 1;
      }
    );
  }

}
