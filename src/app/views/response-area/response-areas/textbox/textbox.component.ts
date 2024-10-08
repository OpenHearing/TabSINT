import { Component, OnDestroy, OnInit } from '@angular/core';
import { ResultsInterface } from '../../../../models/results/results.interface';
import { ResultsModel } from '../../../../models/results/results-model.service';
import { ProtocolModel } from '../../../../models/protocol/protocol-model.service';
import { ProtocolModelInterface } from '../../../../models/protocol/protocol.interface';
import { StateInterface } from '../../../../models/state/state.interface';
import { StateModel } from '../../../../models/state/state.service';
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
  protocol: ProtocolModelInterface;
  state: StateInterface
  rows: number;
  pageSubscription: Subscription | undefined;

  constructor (
    private readonly resultsModel: ResultsModel, 
    private readonly pageModel: PageModel, 
    private readonly protocolModel: ProtocolModel, 
    private readonly stateModel: StateModel
  ) {
    this.results = this.resultsModel.getResults();
    this.protocol = this.protocolModel.getProtocolModel();
    this.state = this.stateModel.getState();
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
