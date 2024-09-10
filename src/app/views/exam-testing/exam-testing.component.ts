import { Component, Inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { DomSanitizer } from '@angular/platform-browser';

import { ResultsInterface } from '../../models/results/results.interface';
import { ResultsModel } from '../../models/results/results-model.service';
import { ExamService } from '../../controllers/exam.service';
import { WINDOW } from '../../utilities/window';
import { ProtocolModelInterface } from '../../models/protocol/protocol.interface';
import { ProtocolModel } from '../../models/protocol/protocol-model.service';
import { StateModel } from '../../models/state/state.service';
import { StateInterface } from '../../models/state/state.interface';
import _ from 'lodash';

@Component({
  selector: 'exam-testing-view',
  templateUrl: './exam-testing.component.html',
  styleUrl: './exam-testing.component.css'
})
export class ExamTestingComponent {
  results: ResultsInterface;
  protocol: ProtocolModelInterface;
  state: StateInterface;
  questionMainText?: string;
  questionSubText?: string;
  instructionText?: string;

  constructor(
    public resultsModel: ResultsModel,
    public translate: TranslateService,
    public examService: ExamService,
    public sanitizer: DomSanitizer,
    public protocolModel: ProtocolModel,
    public stateModel: StateModel,
    @Inject(WINDOW) private window: Window
  ) { 
    this.results = this.resultsModel.getResults();
    this.protocol = this.protocolModel.getProtocolModel();
    this.state = this.stateModel.getState();

    this.questionMainText = this.examService?.currentPage?.questionMainText;
    this.questionSubText = this.examService.currentPage.questionSubText;
    this.instructionText = this.examService.currentPage.instructionText;
  }

  isMediaLoading = this.examService?.currentPage?.loadingRequired && this.examService?.currentPage?.loadingActive;
  isLoadingComplete = this.examService?.currentPage?.loadingRequired && !this.examService?.currentPage?.loadingActive;
  
  examTestingTitleClass = {
    undefined: _.isUndefined(this.examService?.currentPage?.questionMainText),
    medium: ((this.examService?.currentPage?.questionMainText!.length >= 38) 
      && (this.examService?.currentPage?.questionMainText!.length < 48)), 
    long: (this.examService?.currentPage?.questionMainText!.length > 42)
  };

  testHTML = this.sanitizer.bypassSecurityTrustHtml(`
    <button id="my-button" (click)=testFunction() >Button 1</button>
    <button (click)=console.log('test'); >Button 2</button>
    <button onclick=console.log('test'); >Button 3</button>
    <button onclick=console.log(window.pageModel); >Button 4</button>
  `);

  ngAfterViewInit() {
    // console.log(document.getElementById('my-button') as HTMLElement);
    if (document.getElementById('my-button') as HTMLElement) {
      (document.getElementById('my-button') as HTMLElement).addEventListener('click', this.testFunction.bind(this));
    }
  }

  startExam() {
    this.examService.currentPage.loadingRequired=false; 
    this.examService.finishActivateMedia();
  }

  testing() {
    /* Testing the viability of customHS using the JS built in eval method (not angularJS) */
    // console.log(this.pageModel);
    // console.log((this.window as any).pageModel);
    // eval("console.log('this logs a string!')");
    // eval("console.log(this.stateModel.stateModel)");
  }

  testFunction() {
    console.log('this is a test');
    // console.log(this.page.questionMainText);
    // this.page.questionMainText = 'different question main text';
    // console.log(this.page.questionMainText);
  }

}
