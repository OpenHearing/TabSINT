import { Component } from '@angular/core';

import { ExamService } from '../../../../controllers/exam.service';
import { ResultsInterface } from '../../../../models/results/results.interface';
import { ResultsModel } from '../../../../models/results/results.service';
import { ProtocolModel } from '../../../../models/protocol/protocol.service';
import { ProtocolModelInterface } from '../../../../models/protocol/protocol-model.interface';
import { StateInterface } from '../../../../models/state/state.interface';
import { StateModel } from '../../../../models/state/state.service';
import { Observable } from 'rxjs/internal/Observable';

@Component({
  selector: 'textbox-view',
  templateUrl: './textbox.component.html',
  styleUrl: './textbox.component.css'
})
export class TextboxComponent {
  results: ResultsInterface;
  protocol: ProtocolModelInterface;
  state: StateInterface
  rows: number;
  observableVar: any;

  constructor (public resultsModel: ResultsModel, public examService: ExamService, public protocolModel: ProtocolModel, public stateModel: StateModel) {
    this.results = this.resultsModel.getResults();
    this.protocol = this.protocolModel.getProtocolModel();
    this.state = this.stateModel.getState();

    this.rows = this.examService.currentPage.responseArea.rows;
    this.observableVar = this.examService.currentPageObservable;

    this.observableVar.subscribe( (updatedPage:any) => {
      // TODO: This ternary might not be needed. Should the exam service send the default value if one is not specified?
        this.rows = updatedPage?.responseArea?.rows ? updatedPage?.responseArea?.rows : 1;
      }
    );
  }

}
