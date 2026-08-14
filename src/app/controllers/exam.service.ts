import { Injectable, inject } from '@angular/core';
import { combineLatest, firstValueFrom, interval, Subscription } from 'rxjs';
import {
  isChoiceResponseArea,
  isPageDefinition,
  isProtocolReferenceInterface,
  isProtocolSchemaInterface,
  isProtocolStarted,
  isStatusResponse,
} from '../guards/type.guard';
import { PageTypes } from '../types/custom-types';
import {
  ChaWavfilesInterface,
  FollowOnInterface,
  PageDefinition,
  PageWavfileInterface,
  ProtocolReferenceInterface,
} from '../interfaces/page-definition.interface';
import { CurrentResults, ResultsInterface } from '../models/results/results.interface';
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
import { DialogType, ExamState, AppState, DeviceType, DeviceState } from '../utilities/constants';
import { Notifications } from '../services/notifications.service';
import { Logger } from '../services/logger.service';
import { calculateElapsedTime, checkForSpecialReference, getDefaultResponseRequired } from '../utilities/exam-helper-functions';
import { ProtocolStackItem } from '../models/protocol/protocol-stack';
import { ChoiceInterface } from '../interfaces/choice.interface';
import { ProtocolSchemaInterface } from '../interfaces/protocol-schema.interface';
import { DevicesService } from '../services/devices/devices.service';
import { IDevice } from '../interfaces/devices/device.interface';
import { DosimeterResultsInterface } from '../interfaces/dosimeter-results.interface';
import { ISvantekDevice } from '../interfaces/devices/svantek-device.interface';
import { pageSchema } from '../../schema/page.schema';
import { AudioService } from '../services/audio.service';
import { Tasks } from '../services/tasks.service';

@Injectable({
  providedIn: 'root',
})
export class ExamService {
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
  private readonly devicesService = inject(DevicesService);
  private readonly audioService = inject(AudioService);
  private readonly tasks = inject(Tasks);

  protocol: ProtocolModelInterface;
  results: ResultsInterface;
  state: StateInterface;

  pageSubscription: Subscription | undefined;
  stateSubscription: Subscription | undefined;
  resultsSubscription: Subscription | undefined;

  // eslint-disable-next-line @typescript-eslint/consistent-indexed-object-style
  dosimeterResultsPoll: { [name: string]: ReturnType<typeof setInterval> } = {};
  private activeWavfileDevice: string | undefined = undefined;
  private activeSvantekDevice: ISvantekDevice | undefined = undefined;
  private svantekResultPoll: ReturnType<typeof setInterval> | undefined = undefined;
  private svantekWarned = false;

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
    if (this.protocol.activeProtocol === undefined) {
      if (this.tasks.isOngoing('Load Protocol')) {
        this.notifications
          .alert({
            title: 'Alert',
            content: 'Protocol is still loading. Please wait for loading to complete before proceeding.',
            type: DialogType.Alert,
          })
          .subscribe();
      } else {
        this.notifications
          .alert({
            title: 'Alert',
            content: 'No protocol has been loaded. Please scan your QR Code or navigate to the Admin View and load a protocol.',
            type: DialogType.Alert,
          })
          .subscribe();
      }
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
    this.svantekWarned = false;
    this.resultsService.initializeExamResults();
    this.stateModel.updateState({ examState: ExamState.Testing });
    this.protocol.activeProtocolStack.addProtocol(this.protocol.activeProtocol!);
    this.audioService.setSystemVolume(1);
    this.advancePage();
  }

  /** Default submit function for exam pages.
   * @summary Appends current page results to current exam results, calls advancePage(), and resets.
   * @models results, state
   */
  submitDefault() {
    this.gradeResponses();
    this.resultsService.pushResults(this.results.currentPage);
    this.setFlags(this.results.currentPage);
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
    this.resultsService.pushResults(this.results.currentPage);
    this.setFlags(this.results.currentPage);
    this.resetProtocolStack();
    if (this.protocol.activeProtocolDictionary!['@PARTIAL'] === undefined) {
      this.endExam();
    } else {
      this.navigateToTarget('@PARTIAL');
    }
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
    this.advancePage();
  }

  /**
   * Navigate to target function. Can be overwritten by exams.
   * @param subProtocolID The sub protocol page identifier.
   */
  navigateToTarget(subProtocolID: string) {
    this.navigateToTargetDefault(subProtocolID);
  }

  /**
   * Restart the active page by decrementing the current page index and re-advancing.
   */
  async restartActivePage() {
    const currentProtocol = this.protocol.activeProtocolStack.peek();
    const currentPageIndex = currentProtocol?.pageIndex;
    if (currentPageIndex === undefined) {
      this.logger.debug('Failed to reset active page, no active page available.');
    } else {
      this.protocol.activeProtocolStack.updateCurrentProtocol({ pageIndex: Math.max(currentPageIndex - 1, -1) });
      await this.advancePage();
    }
  }

  /**
   * Cancel background processes which are related to an active exam.
   */
  cancelBackgroundProcesses() {
    this.stopDosimetry();
    this.stopSvantek();
    this.stopChaWavfiles();
    this.audioService.stopAudio();
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
  private getPagesFromAdvancedLogic(page: PageDefinition): PageTypes[] {
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
  private setFlags(pageResult: CurrentResults) {
    const page = pageResult.page;
    if (page.setFlags) {
      page.setFlags.forEach(flags => {
        if (this.conditionalEvaluator(flags.conditional)) {
          this.results.currentExam.flags[flags.id] = flags.value ?? true;
          this.logger.debug('Flag set: ' + flags.id);
        }
      });
    }
  }

  private async handlePreProcessFunctions(page: PageDefinition) {
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
        page,
      };

      eval(page.preProcessFunction.js! + '\n' + page.preProcessFunction.function + '()');
    }
  }

  /** Handles special references
   * @summary Handles the special references
   */
  private handleSpecialReferences(id: string | undefined) {
    if (id === '@PARTIAL') {
      this.submitPartial();
    } else if (id === '@END_ALL') {
      this.endExam();
      return;
    }
  }

  private resetFunctionsToDefaults() {
    this.reset = this.resetDefault;
    this.submit = this.submitDefault;
    this.submitPartial = this.submitPartialDefault;
    this.navigateToTarget = this.navigateToTargetDefault;
    this.gradeResponses = this.gradeResponsesDefault;
  }

  /**
   * Proceed to next page in the exam with handling of pre-processing and post-processing.
   */
  private async advancePage() {
    // Reset everything to defaults on the start of each new page
    this.resetFunctionsToDefaults();
    this.cancelBackgroundProcesses();

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
    this.protocol.activeProtocolStack.updateCurrentProtocol({ pageIndex: pageIndex });

    // A protocol should be removed from the stack if all of its pages have been completed or it has timed out
    if (pageIndex >= pageQueue.length || this.hasProtocolTimedOut(currentProtocol, pageIndex)) {
      if (pageIndex < pageQueue.length) {
        this.handleProtocolTimeout(currentProtocol, pageIndex);
      }
      this.protocol.activeProtocolStack.pop();
      this.advancePage();
      return;
    }

    const page: PageTypes = pageQueue[pageIndex];
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
  private findFollowOn(page: PageDefinition) {
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

  private handleRepeats(page: PageDefinition) {
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
      for (let i = currentRepeatCount + 1; i < Math.min(numRepititions + currentRepeatCount + 1, 4); i++) {
        const repeatedPage: PageDefinition = structuredClone(page);
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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const response = this.results.currentPage.response?.selected ?? this.results.currentPage.response;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const flags = this.resultsModel.getResults().currentExam.flags;

    conditional = conditional.replaceAll(/\bflags\b/g, 'flags');
    conditional = conditional.replaceAll(/\bresult\.response(?:\.selected)?\b/g, 'response');
    return eval(conditional);
  }

  /** Resets the protocol stack and exam index.
   * @summary Resets the protocol stack to an empty array and the exam index to 0.
   */
  private resetProtocolStack() {
    this.cancelBackgroundProcesses();
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

  /**
   * Activate media for a page, currently supports activation for audio only.
   * @param page The page for media activation.
   */
  async activateMedia(page: PageDefinition) {
    this.stopChaWavfiles();
    this.audioService.stopAudio();
    if (page.wavfiles) {
      const startDelayTime = page.wavfileStartDelayTime ? page.wavfileStartDelayTime : pageSchema.properties.wavfileStartDelayTime.default;
      await this.playWavFile(page.wavfiles, startDelayTime);
    }
    if (page.chaWavFiles) {
      await this.playChaWavFile(page.chaWavFiles);
    }
  }

  // Ignore the below functions for now

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
   * Checks whether a protocol has exceeded its timeout, based on pages completed or elapsed time.
   * @param protocol The protocol stack item to check.
   * @param pagesDone The number of pages completed so far in this protocol.
   * @returns True if the protocol's nMaxPages or nMaxSeconds timeout has been reached.
   */
  private hasProtocolTimedOut(protocol: ProtocolStackItem, pagesDone: number): boolean {
    const elapsedSeconds = (Date.now() - protocol.startTime.getTime()) / 1000;
    return pagesDone >= protocol.maxPages || elapsedSeconds >= protocol.maxSeconds;
  }

  /**
   * Logs and, if configured, alerts the user that a protocol has timed out.
   * @param protocol The protocol stack item that timed out.
   * @param pagesDone The number of pages completed so far in this protocol.
   */
  private handleProtocolTimeout(protocol: ProtocolStackItem, pagesDone: number) {
    this.logger.debug(`Protocol ${protocol.protocolId} timed out after ${pagesDone} pages.`);
    if (protocol.showAlert) {
      this.notifications
        .alert({
          title: 'Alert',
          content: `This (sub)exam has timed out after ${pagesDone} pages.`,
          type: DialogType.Alert,
        })
        .subscribe();
    }
  }

  /**
   * Initializes the provided page and set it as the current page.
   * @param pageDef The new page to initialize.
   */
  private initializeCurrentPage(pageDef: PageDefinition) {
    // Clone so a preprocess function's overrides (via window.tabsint.page) apply only to this
    // render and never mutate the canonical page stored in the protocol's page queue.
    const page = { ...pageDef, _uuid: crypto.randomUUID() };
    const pageForRender = structuredClone(page);
    this.handlePreProcessFunctions(pageForRender);
    this.pageModel.updatePage(pageForRender);
    this.stateModel.updateState({
      doesResponseExist: false,
      isResponseRequired: this.isPageResponseRequired(pageForRender),
    });
    this.stateModel.setPageSubmittable();
    this.resultsService.initializePageResults(pageForRender);
    this.window.scrollTo({ top: 0, behavior: 'smooth' });
    this.activateDosimeters(pageForRender);
    this.activateSvantek(pageForRender);
    this.activateMedia(pageForRender);
    this.handleAutoSubmitDelay(pageForRender);
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

  /**
   * Activate dosimeters if called for. If dosimetry is called for and none are specified with a tabsintID
   * then all currently connected dosimeters will be triggered. Otherwise, only the dosimeters specified
   * with a tabsintID will be be triggered. If dosimetry is called for and not available, and error will
   * be logged but tabsint will proceed without a device error.
   * @param page The page to use for navigation.
   */
  private async activateDosimeters(page: PageDefinition) {
    let dosimeters: IDevice[];
    if (page?.dosimetry === undefined) {
      return;
    } else if (page.dosimetry.tabsintId === undefined) {
      dosimeters = await this.devicesService.getDeviceOrDefault(undefined, [DeviceType.Duodose]);
    } else {
      dosimeters = [];
      page.dosimetry.tabsintId.forEach(async tabsintId => {
        const devices = await this.devicesService.getDeviceOrDefault(tabsintId, []);
        if (devices.length === 1) {
          dosimeters.push(devices[0]);
        }
      });
    }
    if (dosimeters.length === 0) {
      this.logger.error('Failed to start dosimetry: No dosimeter was available.');
      return;
    }
    this.logger.debug('Starting Dosimetry');
    this.resultsModel.updateCurrentPage({ dosimetry: [] });
    dosimeters.forEach(async dosimeter => {
      await this.devicesService.abortExams(dosimeter);
      this.resultsModel.updateCurrentPage({ response: [] });
      const queueResp = await this.devicesService.queueExam(dosimeter, 'DosimeterRecord', {});
      // TODO: add error handling for above line?
      if (queueResp!.msg[1] != 'ERROR') {
        this.dosimeterResultsPoll[dosimeter.tabsintId] = setInterval(this.pollForDosimeterResults.bind(this), 500, dosimeter);
      }
    });
  }

  /**
   * Start recording from a Svantek dosimeter if the page has svantek: true.
   * Warns once per exam if no Svantek is connected but does not block exam progression.
   * @param page The page being initialized.
   */
  private async activateSvantek(page: PageDefinition) {
    this.resultsModel.updateCurrentPage({ svantek: undefined });
    if (!page.svantek) {
      return;
    }
    const devices = await this.devicesService.getDeviceOrDefault(undefined, [DeviceType.Svantek]);
    if (devices.length === 0) {
      this.logger.warning('A Svantek dosimeter is not connected, no Svantek data will be collected.');
      if (!this.svantekWarned) {
        this.notifications
          .alert({
            title: 'Alert',
            content: 'A Svantek dosimeter is not connected, no Svantek data will be collected.',
            type: DialogType.Alert,
          })
          .subscribe();
        this.svantekWarned = true;
      }
      return;
    }
    this.activeSvantekDevice = devices[0];
    try {
      await this.devicesService.startRecording(this.activeSvantekDevice);
      this.svantekResultPoll = setInterval(() => {
        const result = this.devicesService.getSvantekResult(this.activeSvantekDevice!);
        if (result) {
          this.resultsModel.updateCurrentPage({ svantek: result });
        }
      }, 500);
    } catch (err) {
      this.logger.error('Failed to start Svantek recording', err);
      this.activeSvantekDevice = undefined;
    }
  }

  /**
   * Stop the active Svantek recording and capture the latest measurement into currentPage results.
   * Idempotent — safe to call when no Svantek recording is active.
   */
  stopSvantek() {
    if (!this.activeSvantekDevice) {
      return;
    }
    if (this.svantekResultPoll !== undefined) {
      clearInterval(this.svantekResultPoll);
      this.svantekResultPoll = undefined;
    }
    this.devicesService.stopRecording(this.activeSvantekDevice).catch(err => {
      this.logger.error('Failed to stop Svantek recording', err);
    });
    this.activeSvantekDevice = undefined;
  }

  /**
   * Stop polling results for all dosimeters.
   */
  stopDosimetry() {
    Object.keys(this.dosimeterResultsPoll).forEach(key => {
      this.logger.debug('Stopping dosimetry for: ' + key);
      clearInterval(this.dosimeterResultsPoll[key]);
      delete this.dosimeterResultsPoll[key];
    });
  }

  /**
   * Stop all running wavfiles on a CHA device.
   */
  async stopChaWavfiles() {
    if (this.activeWavfileDevice) {
      const device = (await firstValueFrom(this.devicesService.devices)).find(device => device.deviceId === this.activeWavfileDevice);
      if (device?.state === DeviceState.Connected) {
        const response = await this.devicesService.requestStatus(device);
        // Cancel any ongoing exams for the active wav file device
        if (isStatusResponse(response) && response.msg[1].state === 2) {
          this.devicesService.abortExams(device);
        }
      }
      this.activeWavfileDevice = undefined;
    }
  }

  /**
   * Polling function to get results from dosimeter.
   * @param dosimeter The dosimeter to get results from.
   */
  async pollForDosimeterResults(dosimeter: IDevice) {
    try {
      const resp = await this.devicesService.requestResults(dosimeter);
      const res = resp?.msg[1] as any;
      const time = new Date().toJSON();
      const dosimeterResults: DosimeterResultsInterface = {
        time: time,
        status: res.State,
        Leq: undefined,
        Frequencies: [
          20, 25, 31.5, 40, 50, 63, 80, 100, 125, 160, 200, 250, 315, 400, 500, 630, 800, 1000, 1250, 1600, 2000, 2500, 3150, 4000, 5000, 6300, 8000,
          10000,
        ],
        LeqA: res.Channel_2,
        LeqB: res.Channel_3,
        LeqC: res.Channel_4,
      };
      this.resultsModel.pushDosimeterData(structuredClone(dosimeterResults));
    } catch {
      this.logger.debug('Failed requesting results during dosimetry for device: ' + dosimeter.tabsintId);
    }
  }

  /**
   * Play CHA wav files on a device.
   * @param chaWavfiles The CHA wav file object containing playback information.
   */
  async playChaWavFile(chaWavfiles: ChaWavfilesInterface) {
    const allowableDevices = [DeviceType.Wahts];
    const deviceList = await this.devicesService.getDeviceOrDefault(chaWavfiles.tabsintId, allowableDevices);
    const device = await this.devicesService.confirmSingleDevice(deviceList);
    if (!device) {
      this.logger.error('Error playing CHA files, check the provided wav files and connected device.');
      return;
    }
    try {
      const status = await this.devicesService.requestStatus(device);
      if (isStatusResponse(status)) {
        if (status.msg[1].state === 2) {
          this.logger.warning('CHA exam is still running while user queues an exam. Aborting exams...');
          await this.devicesService.abortExams(device);
        } else if (status.msg[1].state !== 1) {
          this.logger.error('Unexpected device status, CHA wav files will not be played.');
          return;
        }
      } else {
        this.logger.error('Invalid device response, CHA wav files will not be played.');
        return;
      }

      let playSoundProperties: Record<string, unknown> = {
        UseMetaRMS: chaWavfiles.UseMetaRMS ?? chaWavfiles.useMetaRMS ?? false,
        SoundFileName: this.prefixSoundFilePath(chaWavfiles.wavfiles[0].SoundFileName ?? chaWavfiles.wavfiles[0].path),
        Leq: this.resizeLeq(chaWavfiles.wavfiles[0].Leq),
      };
      if (chaWavfiles.wavfiles.length > 1) {
        playSoundProperties = {
          ...playSoundProperties,
          SecondSoundFileName: this.prefixSoundFilePath(chaWavfiles.wavfiles[1].SoundFileName ?? chaWavfiles.wavfiles[1].path),
          SecondLeq: this.resizeLeq(chaWavfiles.wavfiles[1].Leq),
        };
      }
      await this.devicesService.queueExam(device, 'PlaySound', playSoundProperties);
      this.activeWavfileDevice = device.deviceId;
    } catch (err) {
      this.activeWavfileDevice = undefined;
      this.logger.error('Failed to play CHA wav files', err);
      this.notifications
        .alert({
          title: 'Alert',
          content: 'Failed to play CHA wav files, check logging for more information.',
          type: DialogType.Alert,
        })
        .subscribe();
    }
  }

  /**
   * Play wav files on a device.
   * @param wavfiles The wav file objects containing playback information.
   * @param startDelayMs The time to delay the initial play by in milliseconds.
   */
  async playWavFile(wavfiles: PageWavfileInterface[], startDelayMs: number) {
    try {
      await Promise.all(
        wavfiles.map(async wavfile => {
          await this.audioService.playWav(wavfile, startDelayMs);
        })
      );
    } catch (err) {
      this.logger.error('Failed to play wav files', err);
      this.notifications
        .alert({
          title: 'Alert',
          content: 'Failed to play wav files, check logging for more information.',
          type: DialogType.Alert,
        })
        .subscribe();
    }
  }

  /**
   * Prefix a file path with the proper user directory.
   * @param fileName The file path to prefix.
   * @returns The prefixed path or an empty string if input is empty.
   */
  private prefixSoundFilePath(fileName: string): string {
    if (!fileName) {
      return String();
    }
    let prefixedFileName = fileName;
    if (!prefixedFileName.startsWith('C:')) {
      prefixedFileName = 'C:USER/' + prefixedFileName;
    }
    return prefixedFileName;
  }

  /**
   * Resize an Leq array to a default size using zero fills.
   * @param arr The array to resize.
   * @param size The output size of the array.
   * @returns The resized array filled with extra zeros.
   */
  private resizeLeq(arr: number[] | undefined = [72, 72, 0, 0], size: number = 4): number[] {
    return (arr ?? []).slice(0, size).concat(new Array(Math.max(0, size - (arr ?? []).length)).fill(0));
  }
}
