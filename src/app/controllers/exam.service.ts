import { Injectable, inject } from '@angular/core';
import { combineLatest, interval, Subscription } from 'rxjs';
import {
  isChoiceResponseArea,
  isPageDefinition,
  isProtocolReferenceInterface,
  isProtocolSchemaInterface,
  isProtocolStarted,
} from '../guards/type.guard';
import { PageTypes } from '../types/custom-types';
import { FollowOnInterface, PageDefinition, ProtocolReferenceInterface } from '../interfaces/page-definition.interface';
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
import { ProtocolStackItem } from '../models/protocol/protocol-stack';
import { ChoiceInterface } from '../interfaces/choice.interface';
import { ProtocolSchemaInterface } from '../interfaces/protocol-schema.interface';

@Injectable({
  providedIn: 'root',
})
export class ExamService {
  protocol: ProtocolModelInterface;
  results: ResultsInterface;
  state: StateInterface;

  pageSubscription: Subscription | undefined;
  stateSubscription: Subscription | undefined;
  resultsSubscription: Subscription | undefined;

  private readonly logger = inject(Logger);
  private readonly resultsService = inject(ResultsService);
  private readonly resultsModel = inject(ResultsModel);
  private readonly pageModel = inject(PageModel);
  private readonly protocolModel = inject(ProtocolModel);
  private readonly stateModel = inject(StateModel);
  private readonly notifications = inject(Notifications);
  private readonly window = inject(WINDOW);
  private readonly fileService = inject(FileService);
  private readonly diskModel = inject(DiskModel);

  constructor() {
    this.results = this.resultsModel.getResults();
    this.state = this.stateModel.getState();
    this.protocol = this.protocolModel.getProtocolModel();
    this.stateSubscription = this.stateModel.stateSubject.subscribe(updatedState => {
      this.state = updatedState;
    });
    this.resultsSubscription = this.resultsModel.resultsSubject.subscribe(updatedResults => {
      this.results = updatedResults;
    });
    combineLatest([this.protocolModel.getProtocolModel().activeProtocolStack.latestProtocolObservable, interval(1000)]).subscribe(
      ([latestStackItem]) => {
        this.updateExamProgress(latestStackItem);
      }
    );
  }

  /** Switches to exam view.
   * @summary Can be called from any other TabSINT view. If protocol stack is not empty, the exam
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

    if (!this.protocol.activeProtocolStack.peek()) {
      this.stateModel.updateState({ examState: ExamState.Ready });
    }
  }

  /** Begins TabSINT exam.
   * @summary Adds pages to protocolStack and changes examState to Testing.
   * @models protocol, state
   */
  async begin() {
    this.resetProtocolStack();
    this.resultsService.initializeExamResults();
    this.stateModel.updateState({ examState: ExamState.Testing });
    this.protocol.activeProtocolStack.addProtocol(this.protocol.activeProtocol!);
    this.advancePage();
    this.submit = this.submitDefault;
  }

  /** Default submit function for exam pages.
   * @summary Appends current page results to current exam results, calls advancePage(), and resets.
   * @models results, state
   */
  submitDefault() {
    this.gradeResponses();
    this.gradeResponses = this.gradeResponsesDefault;
    this.resultsService.pushResults(this.results.currentPage);
    this.submit = this.submitDefault;
    this.advancePage();
  }

  /** Submit function for exam pages. Can be overwritten by exams.
   * @models results, state
   */
  submit() {
    this.submitDefault();
  }

  gradeResponsesDefault() {
    this.results.currentPage.correct = undefined;
    if (isChoiceResponseArea(this.results.currentPage?.page?.responseArea)) {
      const choices: ChoiceInterface[] | undefined = this.results.currentPage.page.responseArea.choices;
      if (choices) {
        choices.forEach((choice: ChoiceInterface) => {
          if (choice?.correct && JSON.stringify(this.results.currentPage.response.selected) === JSON.stringify([choice.id])) {
            this.results.currentPage.correct = true;
          }
          if (choice?.correct && this.results.currentPage.correct === undefined) {
            this.results.currentPage.correct = false;
          }
        });
      }
    }
  }

  gradeResponses() {
    this.gradeResponsesDefault();
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
    this.resetProtocolStack();
  }

  reset() {
    this.resetDefault();
  }

  /**
   * Default submit partial function for exam pages.
   */
  submitPartialDefault() {
    this.gradeResponses();
    this.gradeResponses = this.gradeResponsesDefault;
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
    const referenceProtocol = this.protocol.activeProtocolDictionary![subProtocolID];
    this.protocol.activeProtocolStack.addProtocol(referenceProtocol);
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

  /** Grabs all pages necessary from advanced logic (skips, repeats, followOns, preprocess)
   * @summary The exam will proceed to the correct page.
   * @models page
   */
  private getPagesFromAdvancedLogic(page: PageInterface): PageTypes[] {
    const pageList: PageTypes[] = [];
    if (page.repeatPage) {
      const repeatedPages = this.handleRepeats(page);
      if (repeatedPages !== undefined) {
        repeatedPages.forEach(repeatedPage => {
          pageList.push(repeatedPage);
        });
      }
    }
    if (page.followOns) {
      const nextID = this.findFollowOn(page);
      if (nextID != undefined) {
        if (checkForSpecialReference(nextID) || nextID in this.protocol.activeProtocolDictionary!) {
          const followOnReference: ProtocolReferenceInterface = {
            reference: nextID,
          };
          pageList.push(followOnReference);
        } else {
          this.notifications
            .alert({
              title: 'Alert',
              content: `FollowOn target ${nextID} not found. Please check your protocol.`,
              type: DialogType.Alert,
            })
            .subscribe();
        }
      }
    }
    return pageList;
  }

  /** Checks for flags and sets them
   * @summary TBD.
   */
  private setFlags(page: PageInterface) {
    if (page.setFlags) {
      page.setFlags.forEach(flags => {
        if (this.conditionalEvaluator(flags.conditional)) {
          this.results.currentExam.flags[flags.id] = true;
          this.logger.debug('Flag set: ' + flags.id);
        }
      });
    }
  }

  private async handlePreProcessFunctions(page: PageInterface) {
    if (page.preProcessFunction) {
      this.window.tabsint = {
        logger: this.logger,
        examService: this,
        fileService: this.fileService,
        resultsService: this.resultsService,
        stateModel: this.stateModel,
        diskModel: this.diskModel,
        resultsModel: this.resultsModel,
        pageModel: this.pageModel,
        protocolModel: this.protocolModel,
      };

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

  /**
   * Proceed to next page in the exam with handling of pre-processing and post-processing.
   */
  private advancePage() {
    const currentProtocol = this.protocol.activeProtocolStack.peek();
    if (currentProtocol === undefined) {
      this.endExam();
      return;
    }

    // Follow ons should be added for the previous page before iterating to a new page
    let pageIndex = currentProtocol.pageIndex;
    let pageQueue = currentProtocol.pageQueue;
    pageQueue = this.addFollowOns(pageQueue, pageIndex);
    this.protocol.activeProtocolStack.updateCurrentProtocol({ pageQueue: pageQueue });

    pageIndex = pageIndex + 1;
    const page: PageTypes = pageQueue[pageIndex];
    this.protocol.activeProtocolStack.updateCurrentProtocol({ pageIndex: pageIndex });

    // A protocol should be removed from the stack if all of the pages have been completed
    if (pageIndex >= pageQueue.length) {
      this.protocol.activeProtocolStack.pop();
      this.advancePage();
      return;
    }

    if (isProtocolReferenceInterface(page)) {
      this.protocol.activeProtocolStack.updateCurrentProtocol({ pageIndex: pageIndex + 1 });
      this.handleProtocolReference(page);
    } else if (isProtocolSchemaInterface(page)) {
      this.protocol.activeProtocolStack.updateCurrentProtocol({ pageIndex: pageIndex + 1 });
      this.handleProtocolSchema(page);
    } else if (page.skipIf && this.conditionalEvaluator(page.skipIf)) {
      this.advancePage();
    } else {
      this.initializeCurrentPage(page);
    }
  }

  /** Finds followOn from current page.
   * @summary Finds and returns the followOn ID from a page specified from a response.
   * @models state, results
   * @returns followOn ID: string or undefined
   */
  private findFollowOn(page: PageInterface) {
    let id: string | undefined = undefined;
    page.followOns?.forEach((followOn: FollowOnInterface) => {
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

  private handleRepeats(page: PageInterface) {
    let repeatedPages: PageTypes[] | undefined;
    // repeat if repeatIf not present or it evaluates to true
    if (page.repeatPage!.repeatIf === undefined || (page.repeatPage!.repeatIf && this.conditionalEvaluator(page.repeatPage!.repeatIf))) {
      // determine number of times page has been repeated
      repeatedPages = [];
      let currentRepeatCount = 0;
      if (page.id.includes('_repeated_')) {
        currentRepeatCount = Number(page.id.split('_repeated_')[page.id.split('_repeated_').length - 1]);
      }
      // determine number of repititions
      const numRepititions = Number(page.repeatPage!.nRepeats);
      // create desired number of repeated pages
      for (let i = currentRepeatCount + 1; i < (numRepititions + currentRepeatCount + 1 < 4 ? numRepititions + currentRepeatCount + 1 : 4); i++) {
        const repeatedPage: PageInterface = JSON.parse(JSON.stringify(page));
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
    this.protocol.activeProtocolStack.clear();
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
    this.window.scrollTo(0, 0);
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

  /**
   * Determine the current exam progress based on the page index in the page stack.
   * The active page is included in the progress count.
   *
   * @returns The progress percentage as a number from 0 to 100 or the user defined number/string.
   */
  updateExamProgress(protocol: ProtocolStackItem | undefined) {
    let progress: string | number = 0;

    if (!isProtocolStarted(protocol)) {
      this.stateModel.updateState({ examProgress: progress });
      return;
    }

    // Filter any subprotocols at the end of a protocol as these will not contribute to the visible progress bar
    const filteredQueue: PageTypes[] = structuredClone(protocol.pageQueue);
    for (let index = protocol.pageQueue.length - 1; index > protocol.pageIndex; index--) {
      if (isPageDefinition(protocol.pageQueue[index])) {
        break;
      } else {
        filteredQueue.pop();
      }
    }

    const activePage = protocol.pageQueue[protocol.pageIndex];
    const pageCount = filteredQueue.length;
    const maxPages = protocol.maxPages;
    const maxSeconds = protocol.maxSeconds;

    if (isPageDefinition(activePage) && activePage.progressBarVal) {
      progress = activePage.progressBarVal;
    } else {
      const maxPageProgress = (protocol.pageIndex + 1) / maxPages;
      const maxTimeProgress = Math.floor((Date.now() - protocol.startTime.getTime()) / 1000) / maxSeconds;
      const defaultPageProgress = (protocol.pageIndex + 1) / pageCount;
      const maxProgress = Math.max(maxPageProgress, maxTimeProgress, defaultPageProgress);
      progress = Math.min(Math.max(maxProgress, 0), 1) * 100;
    }
    this.stateModel.updateState({ examProgress: progress });
  }

  /**
   * Initializes the provided page and set it as the current page.
   * @param page The new page to initialize.
   */
  private initializeCurrentPage(page: PageDefinition) {
    this.setFlags(page);
    this.handlePreProcessFunctions(page);
    this.pageModel.updatePage(page);
    this.stateModel.updateState({
      doesResponseExist: false,
      isResponseRequired: this.isPageResponseRequired(page),
    });
    this.stateModel.setPageSubmittable();
    this.resultsService.initializePageResults(page);
    this.window.scrollTo({ top: 0, behavior: 'smooth' });
    this.handleAutoSubmitDelay(page);
  }

  /**
   * Add follow ons to a page queue based on the current index.
   * @param pageQueue The page queue to update.
   * @param pageIndex The index of the current page.
   * @returns The updated page queue.
   */
  private addFollowOns(pageQueue: PageTypes[], pageIndex: number) {
    const page = pageQueue[pageIndex];
    const advancedPagesCopy = page !== undefined && isPageDefinition(page) ? structuredClone(this.getPagesFromAdvancedLogic(page)) : [];
    if (advancedPagesCopy.length > 0) {
      pageQueue = [...pageQueue.slice(0, pageIndex + 1), ...advancedPagesCopy, ...pageQueue.slice(pageIndex + 1)];
    }
    return pageQueue;
  }

  /**
   * Handle navigation for pages which are protocol references.
   * @param page The page to use for navigation.
   */
  private handleProtocolReference(page: ProtocolReferenceInterface) {
    if (page.skipIf && this.conditionalEvaluator(page.skipIf)) {
      this.advancePage();
    } else if (checkForSpecialReference(page.reference)) {
      this.handleSpecialReferences(page.reference);
    } else {
      const referenceProtocol = this.protocol.activeProtocolDictionary![page?.reference];
      this.protocol.activeProtocolStack.addProtocol(referenceProtocol);
      this.advancePage();
    }
  }

  /**
   * Handle navigation for pages which are protocol schema.
   * @param page The page to use for navigation.
   */
  private handleProtocolSchema(page: ProtocolSchemaInterface) {
    this.protocol.activeProtocolStack.addProtocol(page);
    this.advancePage();
  }

  /**
   * Handle autoSubmitDelay if called for.
   * @param page The page to use for navigation.
   */
  private handleAutoSubmitDelay(page: PageDefinition) {
    if (page?.autoSubmitDelay) {
      setTimeout(() => {
        this.submit();
      }, page.autoSubmitDelay);
    }
  }
}
