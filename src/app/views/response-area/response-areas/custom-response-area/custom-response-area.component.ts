import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { ResultsInterface } from '../../../../models/results/results.interface';
import { ProtocolModelInterface } from '../../../../models/protocol/protocol.interface';
import { StateInterface } from '../../../../models/state/state.interface';
import { PageInterface } from '../../../../models/page/page.interface';
import { ResultsModel } from '../../../../models/results/results-model.service';
import { ProtocolModel } from '../../../../models/protocol/protocol-model.service';
import { StateModel } from '../../../../models/state/state.service';
import { PageModel } from '../../../../models/page/page.service';
import { WINDOW } from '../../../../utilities/window';
import { Logger } from '../../../../services/logger.service';
import { ExamService } from '../../../../controllers/exam.service';
import { DiskModel } from '../../../../models/disk/disk.service';
import { FileService } from '../../../../services/file.service';
import { ResultsService } from '../../../../controllers/results.service';
import { ButtonTextService } from '../../../../controllers/button-text.service';
import { CustomResponseAreaInterface } from './custom-response-area.interface';

@Component({
  selector: 'custom-response-area-view',
  templateUrl: './custom-response-area.component.html',
  styleUrl: './custom-response-area.component.css',
})
export class customResponseAreaComponent implements OnInit, OnDestroy {
  results: ResultsInterface;
  protocol: ProtocolModelInterface;
  state: StateInterface;
  html: string | undefined;
  js: string | undefined;
  pageSubscription: Subscription | undefined;
  stateSubscription: Subscription | undefined;
  resultsSubscription: Subscription | undefined;

  constructor(
    private readonly logger: Logger,
    private readonly buttonTextService: ButtonTextService,
    private readonly examService: ExamService,
    private readonly fileService: FileService,
    private readonly resultsService: ResultsService,
    private readonly pageModel: PageModel,
    private readonly diskModel: DiskModel,
    private readonly protocolModel: ProtocolModel,
    private readonly resultsModel: ResultsModel,
    private readonly stateModel: StateModel,
    @Inject(WINDOW) private readonly window: any
  ) {
    this.results = this.resultsModel.getResults();
    this.protocol = this.protocolModel.getProtocolModel();
    this.state = this.stateModel.getState();
  }

  ngOnInit(): void {
    // Expose models and services
    this.window.tabsint = {};
    this.window.tabsint.logger = this.logger;
    this.window.tabsint.examService = this.examService;
    this.window.tabsint.fileService = this.fileService;
    this.window.tabsint.resultsService = this.resultsService;
    this.window.tabsint.stateModel = this.stateModel;
    this.window.tabsint.diskModel = this.diskModel;
    this.window.tabsint.resultsModel = this.resultsModel;
    this.window.tabsint.pageModel = this.pageModel;
    this.window.tabsint.protocolModel = this.protocolModel;
    // Subscribe to observables and load html/js
    this.stateSubscription = this.stateModel.stateSubject.subscribe(updatedState => {
      this.state = updatedState;
    });
    this.resultsSubscription = this.resultsModel.resultsSubject.subscribe(updatedResults => {
      this.results = updatedResults;
    });
    this.pageSubscription = this.pageModel.currentPageObservable.subscribe(async (updatedPage: PageInterface) => {
      if (updatedPage?.responseArea?.type === 'customResponseArea') {
        const responseArea = updatedPage.responseArea as CustomResponseAreaInterface;
        this.html = responseArea?.html;
        this.js = responseArea?.js;
        await this.waitForHTMLToLoad();
      }
    });
  }

  ngOnDestroy(): void {
    this.stateModel.updateState({ isSubmittable: true });
    this.examService.submit = this.examService.submitDefault.bind(this.examService);
    this.examService.reset = this.examService.resetDefault.bind(this.examService);
    this.examService.submitPartial = this.examService.submitPartialDefault.bind(this.examService);
    this.examService.navigateToTarget = this.examService.navigateToTargetDefault.bind(this.examService);
    this.buttonTextService.updateButtonText('Submit');

    this.pageSubscription?.unsubscribe();
    this.resultsSubscription?.unsubscribe();
    this.stateSubscription?.unsubscribe();
  }

  async waitForHTMLToLoad() {
    let htmlEle = <HTMLElement>document.getElementById('custom-div-id');
    while (htmlEle == null) {
      await this.delay(100);
      htmlEle = <HTMLElement>document.getElementById('custom-div-id');
    }
    htmlEle.innerHTML = this.html!;
    eval(this.js!); //NOSONAR
  }

  delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
