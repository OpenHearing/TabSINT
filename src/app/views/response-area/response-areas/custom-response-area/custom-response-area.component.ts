import { Component, inject, OnDestroy, OnInit } from '@angular/core';
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
  selector: 'app-custom-response-area-view',
  templateUrl: './custom-response-area.component.html',
  styleUrl: './custom-response-area.component.css',
})
export class CustomResponseAreaComponent implements OnInit, OnDestroy {
  results: ResultsInterface;
  protocol: ProtocolModelInterface;
  state: StateInterface;
  html: string | undefined;
  js: string | undefined;
  pageSubscription: Subscription | undefined;
  stateSubscription: Subscription | undefined;
  resultsSubscription: Subscription | undefined;

  private readonly logger = inject(Logger);
  private readonly buttonTextService = inject(ButtonTextService);
  private readonly examService = inject(ExamService);
  private readonly fileService = inject(FileService);
  private readonly resultsService = inject(ResultsService);
  private readonly pageModel = inject(PageModel);
  private readonly diskModel = inject(DiskModel);
  private readonly protocolModel = inject(ProtocolModel);
  private readonly resultsModel = inject(ResultsModel);
  private readonly stateModel = inject(StateModel);
  private readonly window = inject(WINDOW);

  constructor() {
    this.results = this.resultsModel.getResults();
    this.protocol = this.protocolModel.getProtocolModel();
    this.state = this.stateModel.getState();
  }

  ngOnInit(): void {
    // Expose models and services
    this.window.tabsint = {
      logger: this.logger,
      examService: this.examService,
      fileService: this.fileService,
      resultsService: this.resultsService,
      stateModel: this.stateModel,
      diskModel: this.diskModel,
      resultsModel: this.resultsModel,
      pageModel: this.pageModel,
      protocolModel: this.protocolModel,
    };
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
        eval(this.js!); //NOSONAR
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
    let htmlEle = document.getElementById('custom-div-id') as HTMLElement;
    while (htmlEle == null) {
      await this.delay(100);
      htmlEle = document.getElementById('custom-div-id') as HTMLElement;
    }
    htmlEle.innerHTML = this.html!;
  }

  delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
