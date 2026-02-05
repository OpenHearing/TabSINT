import { Injectable, Inject } from '@angular/core';
import { Subscription } from 'rxjs';
import { isPageDefinition, isProtocolReferenceInterface, isProtocolSchemaInterface } from '../guards/type.guard';
import { PageTypes } from '../types/custom-types';
import { FollowOnInterface } from '../interfaces/page-definition.interface';
import { ResultsInterface } from '../models/results/results.interface';
import { StateInterface } from '../models/state/state.interface';
import { ProtocolModelInterface } from '../models/protocol/protocol.interface';
import { PageInterface } from '../models/page/page.interface';
import { ResultsService } from './results.service';
import { ResultsModel } from '../models/results/results-model.service';
import { StateModel } from '../models/state/state.service';
import { ProtocolModel } from '../models/protocol/protocol-model.service';
import { PageModel } from '../models/page/page.service';
import { WINDOW } from '../utilities/window';
import { FileService } from '../services/file.service';
import { DiskModel } from '../models/disk/disk.service';
import { DialogType, ExamState, AppState } from '../utilities/constants';
import { Notifications } from '../services/notifications.service';
import { Logger } from '../services/logger.service';
import { calculateElapsedTime, checkForSpecialReference, getDefaultResponseRequired } from '../utilities/exam-helper-functions';

@Injectable({
  providedIn: 'root',
})
export class ExamService {
  protocol: ProtocolModelInterface;
  results: ResultsInterface;
  state: StateInterface;
  currentPage: PageInterface;

  pageSubscription: Subscription | undefined;
  stateSubscription: Subscription | undefined;
  resultsSubscription: Subscription | undefined;

  constructor(
    private readonly logger: Logger,
    private readonly resultsService: ResultsService,
    private readonly resultsModel: ResultsModel,
    private readonly pageModel: PageModel,
    private readonly protocolModel: ProtocolModel,
    private readonly stateModel: StateModel,
    private readonly notifications: Notifications,
    @Inject(WINDOW) private readonly window: any,
    private readonly fileService: FileService,
    private readonly diskModel: DiskModel
  ) {
    this.results = this.resultsModel.getResults();
    this.currentPage = this.pageModel.getPage();
    this.pageSubscription = this.pageModel.currentPageObservable.subscribe((updatedPage: PageInterface) => {
      this.currentPage = updatedPage;
    });
    this.state = this.stateModel.getState();
    this.protocol = this.protocolModel.getProtocolModel();
    this.stateSubscription = this.stateModel.stateSubject.subscribe(updatedState => {
      this.state = updatedState;
    });
    this.resultsSubscription = this.resultsModel.resultsSubject.subscribe(updatedResults => {
      this.results = updatedResults;
    });
  }

  /** Switches to exam view.
   * @summary Can be called from any other TabSINT view. If pageModel.stack is not empty, the exam
   * will proceed where it left off. Otherwise examState gets changed to Ready.
   */
  switchToExamView() {
    if (this.protocol.activeProtocol == undefined) {
      this.notifications
        .alert({
          title: 'Alert',
          content: 'No protocol has been loaded. Please scan your QR Code or navigate to the Admin View and load a protocol.',
          type: DialogType.Alert,
        })
        .subscribe();
      return;
    }

    if (this.pageModel.stack.length == 0) {
      this.stateModel.updateState({ examState: ExamState.Ready });
    }
  }

  /** Begins TabSINT exam.
   * @summary Adds pages to protocolStack and changes examState to Testing.
   * @models protocol, state
   */
  async begin() {
    this.resetProtocolStack();
    this.addPagesToStack(this.protocol.activeProtocol!.pages, 0);
    this.resultsService.initializeExamResults();
    this.startPage();
    this.stateModel.updateState({ examState: ExamState.Testing });
  }

  /** Default submit function for exam pages.
   * @summary Appends current page results to current exam results, calls advancePage(), and resets.
   * @models results, state
   */
  submitDefault() {
    this.resultsService.pushResults(this.results.currentPage);
    this.advancePage();
    this.submit = this.submitDefault;
  }

  /** Submit function for exam pages. Can be overwritten by exams.
   * @models results, state
   */
  submit() {
    this.submitDefault();
  }

  skipDefault() {
    // noop
  }

  skip() {
    // can be used/overwritten in exams
  }

  backDefault() {
    // noop
  }

  back() {
    // used/overwritten by calibration-exam
  }

  /**
   * Default reset function for exam pages.
   */
  resetDefault() {
    this.stateModel.updateState({ examState: ExamState.Ready });
  }

  reset() {
    this.resetDefault();
  }

  /**
   * Default submit partial function for exam pages.
   */
  submitPartialDefault() {
    this.resultsService.pushResults(this.results.currentPage);
    this.submit = this.submitDefault;
    this.endExam();
  }

  submitPartial() {
    this.submitPartialDefault();
  }

  /**
   * Default navigate to target function, which navigates to the specified subprotocol.
   * @param subProtocolID The sub protocol page identifier.
   */
  navigateToTargetDefault(subProtocolID: string) {
    // TODO: returnHereAfterward NOT IMPLEMENTED
    this.currentPage.followOns = [
      {
        conditional: 'true',
        target: { reference: subProtocolID },
      },
    ];
    this.stateModel.updateState({ examState: ExamState.Testing });
    this.submitDefault();
  }

  /**
   * Navigate to target function. Can be overwritten by exams.
   * @param subProtocolID The sub protocol page identifier.
   */
  navigateToTarget(subProtocolID: string) {
    this.navigateToTargetDefault(subProtocolID);
  }

  /** Checks if a page response is required.
   * @summary Checks if a page response is required and returns a boolean
   * @returns boolean if page response is required
   */
  isPageResponseRequired(page: PageInterface): boolean {
    if (page?.responseArea) {
      let responseRequired = page.responseArea.responseRequired;
      if (responseRequired === undefined) {
        const responseType = page.responseArea.type;
        responseRequired = getDefaultResponseRequired(responseType);
      }
      return responseRequired;
    }
    return false;
  }

  /** Advance to next page in the exam
   * @summary Increments the exam page index. Advances to next page in protocolStack. If there is no next page it will
   * search for a followOn. The protocolStack will be updated.
   * @models state
   */
  private advancePage() {
    const nextExamIndex = this.state.examIndex + 1;
    this.setFlags();
    const pageList = this.getPagesFromAdvancedLogic();
    if (pageList !== undefined && pageList.length > 0) {
      this.addPagesToStack(pageList, nextExamIndex);
    }
    // make sure there are more pages, if not end the exam
    if (this.pageModel.stack.length > nextExamIndex) {
      this.stateModel.updateState({ examIndex: nextExamIndex });
      this.startPage();
    } else if (pageList !== undefined) {
      // Undefined page list signals special reference handling.
      // Only end normally if the page list is defined.
      this.endExam();
    }
  }

  /** Grabs all pages necessary from advanced logic (skips, repeats, followOns, preprocess)
   * @summary The exam will proceed to the correct page.
   * @models page
   */
  private getPagesFromAdvancedLogic() {
    const pageList: PageTypes[] = [];
    if (this.currentPage.repeatPage) {
      const repeatedPages = this.handleRepeats();
      if (repeatedPages !== undefined) {
        repeatedPages.forEach(repeatedPage => {
          pageList.push(repeatedPage);
        });
      }
    }
    if (this.currentPage.followOns) {
      const nextID = this.findFollowOn();
      if (nextID != undefined) {
        if (checkForSpecialReference(nextID)) {
          this.handleSpecialReferences(nextID);
          return undefined;
        } else {
          this.protocolModel.protocolModel.activeProtocolDictionary![nextID].pages.forEach((page: PageTypes) => {
            pageList.push(page);
          });
        }
      }
    }
    return pageList;
  }

  /** Checks for flags and sets them
   * @summary TBD.
   */
  private setFlags() {
    if (this.currentPage.setFlags) {
      this.currentPage.setFlags.forEach(flags => {
        if (this.conditionalEvaluator(flags.conditional)) {
          this.results.currentExam.flags[flags.id] = true;
          this.logger.debug('Flag set: ' + flags.id);
        }
      });
    }
  }

  private async handlePreProcessFunctions(page: PageInterface) {
    if (page.preProcessFunction) {
      this.window.tabsint = {};
      this.window.tabsint.logger = this.logger;
      this.window.tabsint.examService = this;
      this.window.tabsint.fileService = this.fileService;
      this.window.tabsint.resultsService = this.resultsService;
      this.window.tabsint.stateModel = this.stateModel;
      this.window.tabsint.diskModel = this.diskModel;
      this.window.tabsint.resultsModel = this.resultsModel;
      this.window.tabsint.pageModel = this.pageModel;
      this.window.tabsint.protocolModel = this.protocolModel;

      eval(page.preProcessFunction.js! + '\n' + page.preProcessFunction.function + '()');
    }
  }

  /** Handles special references
   * @summary Handles the special references
   */
  private handleSpecialReferences(id: string | undefined) {
    if (id === '@PARTIAL') {
      this.endExam();
      this.logger.debug('@PARTIAL not implemented, instead using @END_ALL');
    } else if (id === '@END_ALL') {
      this.endExam();
      return;
    }
  }

  /** Proceed to next page in the exam
   * @summary The exam will proceed
   * to the correct page.
   * @models state
   */
  private startPage() {
    const nextPage: PageInterface = this.pageModel.stack[this.state.examIndex];

    if (nextPage.skipIf && this.conditionalEvaluator(nextPage.skipIf)) {
      this.advancePage();
      /* Note that with this approach we skip over nexting the nextPage
        I think that should be okay as the state.examIndex is being updated in advancePage
        So what should happen here is we completely skip a page
        There would be no record of it in the results and should never get rendered or anything
      */
    } else {
      this.handlePreProcessFunctions(nextPage);
      // Make sure isSubmittable gets set correctly
      this.stateModel.updateState({
        doesResponseExist: false,
        isResponseRequired: this.isPageResponseRequired(nextPage),
      });
      if (nextPage?.isSubmittable === false) {
        this.stateModel.updateState({ isSubmittable: false });
      } else {
        this.stateModel.setPageSubmittable();
      }
      this.pageModel.updatePage(nextPage);
      this.resultsService.initializePageResults(this.currentPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  /** Parse page objects and add them to the pageModel.stack.
   * @summary Adds pages to pageModel.stack. This will parse any page with a reference and put the
   * correct pages in place.
   * @models state, protocol, page
   * @param pages list of page objects
   */
  private addPagesToStack(pages: PageTypes[], index: number) {
    let extraPages: PageTypes[];
    pages.forEach((page: PageTypes) => {
      if (isProtocolReferenceInterface(page)) {
        extraPages = this.protocolModel.protocolModel.activeProtocolDictionary![page?.reference].pages;
        this.addPagesToStack(extraPages, index + 1);
      } else if (isProtocolSchemaInterface(page)) {
        extraPages = page.pages;
        this.addPagesToStack(extraPages, index + 1);
      } else if (isPageDefinition(page)) {
        this.pageModel.stack.splice(index, 0, page);
        index = index + 1;
      }
    });
  }

  /** Finds followOn from current page.
   * @summary Finds and returns the followOn ID from a page specified from a response.
   * @models state, results
   * @returns followOn ID: string or undefined
   */
  private findFollowOn() {
    let id: string | undefined = undefined;
    this.currentPage.followOns?.forEach((followOn: FollowOnInterface) => {
      // backward compatibility
      if (followOn.conditional && this.conditionalEvaluator(followOn.conditional)) {
        // TODO: handle if target is protocol or page
        if (isProtocolReferenceInterface(followOn.target)) {
          id = followOn.target.reference;
        }
      }
    });
    return id;
  }

  private handleRepeats() {
    let repeatedPages: PageTypes[] | undefined;
    // repeat if repeatIf not present or it evaluates to true
    if (
      this.currentPage.repeatPage!.repeatIf === undefined ||
      (this.currentPage.repeatPage!.repeatIf && this.conditionalEvaluator(this.currentPage.repeatPage!.repeatIf))
    ) {
      // determine number of times page has been repeated
      repeatedPages = [];
      let currentRepeatCount = 0;
      if (this.currentPage.id.includes('_repeated_')) {
        currentRepeatCount = Number(this.currentPage.id.split('_repeated_')[this.currentPage.id.split('_repeated_').length - 1]);
      }
      // determine number of repititions
      const numRepititions = Number(this.currentPage.repeatPage!.nRepeats);
      // create desired number of repeated pages
      for (let i = currentRepeatCount + 1; i < (numRepititions + currentRepeatCount + 1 < 4 ? numRepititions + currentRepeatCount + 1 : 4); i++) {
        const repeatedPage: PageInterface = JSON.parse(JSON.stringify(this.currentPage));
        if (i > 1) {
          repeatedPage.id = repeatedPage.id.replace('_repeated_' + String(i - 1), '_repeated_' + String(i));
        } else {
          repeatedPage.id = repeatedPage.id + '_repeated_' + String(i);
        }
        repeatedPages?.push(repeatedPage);
      }
    }
    return repeatedPages;
  }

  /** Handles and evaluates the logic from a protocol conditional.
   * @summary Handles and evaluates the logic from a protocol conditional.
   */
  private conditionalEvaluator(conditional: string) {
    if (conditional.includes('result.response')) {
      conditional = conditional.replace('result.response', 'this.results.currentPage.response');
    }
    return eval(conditional);
  }

  /** Resets the protocol stack and exam index.
   * @summary Resets the protocol stack to an empty array and the exam index to 0.
   */
  private resetProtocolStack() {
    this.pageModel.stack = [];
    this.stateModel.updateState({ examIndex: 0 });
  }

  /**
   * End Exam
   * @summary Save current exam results, set exam state, and scroll page back to top.
   * @models state
   */
  private endExam() {
    this.resultsModel.updateCurrentExam({ elapsedTime: calculateElapsedTime(this.results.currentExam.testDateTime!) });
    this.resultsService.save(this.results.currentExam);
    this.stateModel.updateState({ examState: ExamState.Finalized });
    this.resetProtocolStack();
    window.scrollTo(0, 0);
  }

  switchToAdminView() {
    this.stateModel.updateState({ appState: AppState.Admin });
  }

  // Ignore the below functions for now

  finishActivateMedia() {
    // TODO: We may want to implement this when we add streaming, playSound, and/or video.
  }

  help() {
    // TODO: Implement this!
  }
}
