import { Component, Inject } from '@angular/core';

import { ResultsInterface } from '../../../../models/results/results.interface';
import { ResultsModel } from '../../../../models/results/results-model.service';
import { ProtocolModel } from '../../../../models/protocol/protocol-model.service';
import { ProtocolModelInterface } from '../../../../models/protocol/protocol-model.interface';
import { StateInterface } from '../../../../models/state/state.interface';
import { StateModel } from '../../../../models/state/state.service';
import { WINDOW } from '../../../../utilities/window';
import { PageModel } from '../../../../models/page/page.service';
import { PageInterface } from '../../../../models/page/page.interface';

@Component({
  selector: 'external-response-area-view',
  templateUrl: './external-response-area.component.html',
  styleUrl: './external-response-area.component.css'
})
export class ExternalResponseAreaComponent {
  currentPage: PageInterface;
  results: ResultsInterface;
  protocol: ProtocolModelInterface;
  state: StateInterface
  testHTML: string;
  testJS: string;
  observableVar: any;

  constructor (
    public resultsModel: ResultsModel, 
    public pageModel: PageModel, 
    public protocolModel: ProtocolModel, 
    public stateModel: StateModel,
    @Inject(WINDOW) private window: Window
  ) {
    this.results = this.resultsModel.getResults();
    this.protocol = this.protocolModel.getProtocolModel();
    this.state = this.stateModel.getState();
    this.currentPage = this.pageModel.getPage();

    // this.rows = this.currentPage.responseArea.rows!;
    this.testHTML = "";
    this.testJS = "";
    this.observableVar = this.pageModel.currentPageObservable;

    this.observableVar.subscribe( (updatedPage:any) => {
        this.testHTML = updatedPage?.responseArea?.externalHTML;
        this.testJS = updatedPage?.responseArea?.externalJS;
        this.waitForHTMLToLoad();
      }
    );
  }

  async waitForHTMLToLoad() {
    let htmlEle = <HTMLElement>document.getElementById("external-div-id");
    while (htmlEle==null) {
      await this.delay(50);
      htmlEle = <HTMLElement>document.getElementById("external-div-id");
    }
    htmlEle.innerHTML = this.testHTML;
    eval(this.testJS);
    /* For this to be fully functional we will need to put all of the exam, result, and any other relevent services 
      on the window variable. Additionally, those services will need to know to check the window when external or custom
      response areas are used to obtain results. 

      Could we compile the angular code somehow? Maybe ahead of time?
        See: https://medium.com/angular-in-depth/building-extensible-dynamic-pluggable-enterprise-application-with-angular-aed8979faba5

        The basic concept here is to build a new angular app that contains only the new desired external response area. If
        everything is done with the same angular version the compiled code can be run through an eval(). At best this would
        result in a way larger bundle than necessary, need to use the window version of all functions, and require us to document
        and/or maintain a method of generating the bundle. We also would need to better understand how the bundle gets produced
        especially in regards to the html since we need to know how to inject it (we currently just add it innerHTML of a div).
    */
  }

  delay(ms: number) {
    return new Promise( resolve => setTimeout(resolve, ms) );
  }

}
