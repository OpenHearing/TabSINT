import { TestBed } from '@angular/core/testing';
import { ExamService } from './exam.service';
import { ResultsService } from './results.service';
import { ResultsModel } from '../models/results/results-model.service';
import { ProtocolModel } from '../models/protocol/protocol-model.service';
import { PageModel } from '../models/page/page.service';
import { StateModel } from '../models/state/state.service';
import { Notifications } from '../services/notifications.service';
import { Logger } from '../services/logger.service';
import { AppState, DialogType, ExamState, ProtocolServer, ProtocolState } from '../utilities/constants';
import { BehaviorSubject, of } from 'rxjs';
import { PageInterface } from '../models/page/page.interface';
import { PageDefinition } from '../interfaces/page-definition.interface';
import { StateInterface } from '../models/state/state.interface';
import { ResultsInterface } from '../models/results/results.interface';
import { ProtocolStack, ProtocolStackItem } from '../models/protocol/protocol-stack';
import { PageTypes } from '../types/custom-types';
import { DevicesService } from '../services/devices/devices.service';
import { AudioService } from '../services/audio.service';

describe('ExamService', () => {
  let examService: ExamService;
  let mockResultsService: jasmine.SpyObj<ResultsService>;
  let mockResultsModel: jasmine.SpyObj<ResultsModel>;
  let mockPageModel: jasmine.SpyObj<PageModel>;
  let mockProtocolModel: jasmine.SpyObj<ProtocolModel>;
  let mockStateModel: jasmine.SpyObj<StateModel>;
  let mockNotifications: jasmine.SpyObj<Notifications>;
  let mockLogger: jasmine.SpyObj<Logger>;
  let mockDevicesService: jasmine.SpyObj<DevicesService>;
  let mockAudioService: jasmine.SpyObj<AudioService>;

  beforeEach(() => {
    const mockPage: PageInterface = {
      _uuid: 'test-page',
      id: 'test-page',
      responseArea: {
        responseRequired: false,
        type: 'textboxResponseArea',
      },
      title: 'Mock Page',
      questionMainText: '',
      questionSubText: '',
      instructionText: '',
      helpText: '',
      submitText: '',
    };
    const mockProtocol = {
      protocolId: 'test-protocol',
      name: 'Test Protocol',
      date: new Date().toISOString(),
      version: '1.0',
      server: ProtocolServer.LocalServer,
      admin: true,
      pages: [mockPage],
    };
    const mockProtocolStack = new ProtocolStack();
    mockProtocolStack.addProtocol(mockProtocol);
    const mockProtocolDictionary = { 'test-protocol': mockProtocol };

    mockResultsService = jasmine.createSpyObj('ResultsService', ['initializeExamResults', 'pushResults', 'save', 'initializePageResults']);
    mockResultsModel = jasmine.createSpyObj('ResultsModel', ['getResults']);
    mockPageModel = jasmine.createSpyObj('PageModel', ['getPage', 'stack', 'updatePage']);
    mockPageModel.currentPageObservable = new BehaviorSubject<PageInterface>(mockPage).asObservable();
    mockProtocolModel = jasmine.createSpyObj('ProtocolModel', ['getProtocolModel']);

    mockProtocolModel.getProtocolModel.and.returnValue({
      activeProtocol: mockProtocol,
      activeProtocolStack: mockProtocolStack,
      activeProtocolDictionary: mockProtocolDictionary,
    });
    mockStateModel = jasmine.createSpyObj('StateModel', ['getState', 'setPageSubmittable', 'updateState']);
    mockStateModel.stateSubject = new BehaviorSubject<StateInterface>({
      examState: ExamState.Ready,
      appState: AppState.Exam,
      protocolState: ProtocolState.null,
      deviceError: [],
      doesResponseExist: false,
      isResponseRequired: false,
      isSubmittable: false,
      canGoBack: () => true,
      isPaneOpen: {
        general: false,
        advanced: false,
        devices: false,
        tympans: false,
        wahts: false,
        duodose: false,
        svantek: false,
        softwareHardware: false,
        appLog: false,
        protocols: false,
        protocolsSource: false,
        protocolsMedia: false,
        deviceAdvanced: false,
        completedExams: false,
        exportedAndUploadedResults: false,
      },
      examProgress: 0,
      bluetoothConnected: true,
      wifiConnected: true,
    });

    mockStateModel.getState.and.returnValue({
      examState: ExamState.Ready,
      appState: {
        someAppStateProperty: 'mockValue',
      } as unknown as AppState,

      protocolState: {
        someProtocolProperty: 'mockValue',
      } as unknown as ProtocolState,

      deviceError: [],

      doesResponseExist: false,
      isResponseRequired: false,
      isSubmittable: false,

      canGoBack: () => true,

      isPaneOpen: {
        general: false,
        advanced: false,
        devices: false,
        tympans: false,
        wahts: false,
        duodose: false,
        svantek: false,
        softwareHardware: false,
        appLog: false,
        protocols: false,
        protocolsSource: false,
        protocolsMedia: false,
        deviceAdvanced: false,
        completedExams: false,
        exportedAndUploadedResults: false,
      },

      examProgress: 0,

      bluetoothConnected: true,
      wifiConnected: true,
    });

    mockResultsModel.resultsSubject = new BehaviorSubject<ResultsInterface>({
      currentPage: {
        pageId: 'test-page',
        page: {
          id: 'test-page',
          responseArea: {
            responseRequired: false,
            type: 'textboxResponseArea',
          },
          title: 'Mock Page',
          questionMainText: '',
          questionSubText: '',
          instructionText: '',
          helpText: '',
          submitText: '',
        },
      },
      currentExam: {
        protocol: {
          protocolId: 'test-protocol',
          name: 'Test Protocol',
          date: new Date().toISOString(),
          version: '1.0',
          server: ProtocolServer.LocalServer,
          admin: true,
          pages: [],
        },
        testDateTime: new Date().toISOString(),
        elapsedTime: '00:30:00',
        exportLocation: ProtocolServer.LocalServer,
        responses: [],
        partialresults: [],
        softwareVersion: {
          tabsint: '1.0.0',
          date: new Date().toISOString(),
          rev: 'rev-123',
          version_code: 'v1.2',
          deps: {
            user_agent: 'Mozilla/5.0',
            node: '14.17.0',
            capacitor: '3.2.0',
          },
          plugins: ['plugin1', 'plugin2'],
        },
        tabletLocation: {
          latitude: 37.7749,
          longitude: -122.4194,
          accuracy: 5,
        },
        calibrationVersion: {},
        flags: {},
        hostMetadata: {
          build: '2024.01',
          uuid: 'device-uuid-123',
          version: '1.0.3',
          platform: 'Android',
          model: 'Galaxy Tab S7',
          os: 'Android 11',
          other: 'Some other info',
          diskSpace: '64GB',
        },
        devices: [],
      },
    });

    mockResultsModel.getResults.and.returnValue({
      currentPage: {
        pageId: 'test-page',
        page: {
          id: 'test-page',
        },
      },
      currentExam: {
        protocol: {
          name: 'Test Protocol',
          date: new Date().toISOString(),
          version: '1.0',
          server: ProtocolServer.LocalServer,
          admin: true,
          pages: [],
        },
        testDateTime: new Date().toISOString(),
        elapsedTime: '00:30:00',
        exportLocation: ProtocolServer.LocalServer,
        responses: [],
        partialresults: [],
        softwareVersion: {
          tabsint: '1.0.0',
          date: new Date().toISOString(),
          rev: 'rev-123',
          version_code: 'v1.2',
          deps: {
            user_agent: 'Mozilla/5.0',
            node: '14.17.0',
            capacitor: '3.2.0',
          },
          plugins: ['plugin1', 'plugin2'],
        },

        tabletLocation: {
          latitude: 37.7749,
          longitude: -122.4194,
          accuracy: 5,
        },
        calibrationVersion: {},
        flags: {},
        hostMetadata: {
          build: '2024.01',
          uuid: 'device-uuid-123',
          version: '1.0.3',
          platform: 'Android',
          model: 'Galaxy Tab S7',
          os: 'Android 11',
          other: 'Some other info',
          diskSpace: '64GB',
        },
        devices: [],
      },
    });

    mockNotifications = jasmine.createSpyObj('Notifications', ['alert']);
    mockNotifications.alert.and.returnValue(of('OK'));
    mockLogger = jasmine.createSpyObj('Logger', ['debug']);
    mockDevicesService = jasmine.createSpyObj('DevicesService', ['getDeviceOrDefault', 'abortExams', 'queueExam', 'requestResults']);
    mockAudioService = jasmine.createSpyObj('AudioService', ['stopAudio', 'playWav', 'setSystemVolume']);

    TestBed.configureTestingModule({
      providers: [
        ExamService,
        { provide: ResultsService, useValue: mockResultsService },
        { provide: ResultsModel, useValue: mockResultsModel },
        { provide: PageModel, useValue: mockPageModel },
        { provide: ProtocolModel, useValue: mockProtocolModel },
        { provide: StateModel, useValue: mockStateModel },
        { provide: Notifications, useValue: mockNotifications },
        { provide: Logger, useValue: mockLogger },
        { provide: DevicesService, useValue: mockDevicesService },
        { provide: AudioService, useValue: mockAudioService },
      ],
    });

    examService = TestBed.inject(ExamService);
  });

  it('should be created', () => {
    expect(examService).toBeTruthy();
  });

  it('should begin the exam and set exam state to Testing', async () => {
    mockPageModel.getPage.and.returnValue({
      _uuid: 'test-page',
      id: 'test-page',
      responseArea: { responseRequired: false, type: 'textboxResponseArea' },
    });

    mockPageModel.updatePage.and.stub();

    mockPageModel.currentPageObservable = new BehaviorSubject<PageInterface>({
      _uuid: 'test-page',
      id: 'test-page',
      responseArea: {
        responseRequired: false,
        type: 'textboxResponseArea',
      },
      title: 'Mock Page',
      questionMainText: '',
      questionSubText: '',
      instructionText: '',
      helpText: '',
      submitText: '',
    }).asObservable();

    spyOn(examService, 'advancePage' as never).and.stub();
    await examService.begin();

    expect(mockResultsService.initializeExamResults).toHaveBeenCalled();
  });

  it('should submit the default response and advance the page', () => {
    mockResultsService.pushResults.and.stub();
    spyOn(examService, 'advancePage' as never);

    examService.submitDefault();
    expect(mockResultsService.pushResults).toHaveBeenCalled();
    expect(examService['advancePage' as keyof ExamService]).toHaveBeenCalled();
  });

  it('should reset the exam state to Ready when reset is called', () => {
    examService.reset();
    expect(mockStateModel.getState().examState).toEqual(ExamState.Ready);
  });

  it('should submit partial results and end exam', () => {
    spyOn(examService, 'endExam' as never);

    examService.submitPartial();
    expect(examService['endExam' as keyof ExamService]).toHaveBeenCalled();
  });

  it('should navigate to target protocol and advancePage', () => {
    spyOn(examService, 'advancePage' as never);

    examService.navigateToTarget('test-protocol');
    expect(examService['advancePage' as keyof ExamService]).toHaveBeenCalled();
  });

  it('should determine if a page response is required', () => {
    const mockPage = {
      responseArea: { responseRequired: undefined, type: 'textboxResponseArea' },
    } as PageInterface;
    mockPageModel.getPage.and.returnValue(mockPage);
    spyOn(examService, 'isPageResponseRequired').and.callThrough();

    expect(examService.isPageResponseRequired(mockPage)).toBeDefined();
  });

  describe('switchToExamView', () => {
    it('shows an alert when no protocol is loaded', () => {
      examService.protocol.activeProtocol = undefined;
      examService.switchToExamView();
      expect(mockNotifications.alert).toHaveBeenCalled();
    });

    it('sets exam state to Ready when protocol is loaded but stack is empty', () => {
      examService.protocol.activeProtocolStack.clear();
      examService.switchToExamView();
      expect(mockStateModel.updateState).toHaveBeenCalledWith({ examState: ExamState.Ready });
    });
  });

  describe('help', () => {
    it('shows an alert with the current page helpText when it is defined', () => {
      const mockPage = { helpText: 'Example help text' } as PageInterface;
      mockPageModel.getPage.and.returnValue(mockPage);

      examService.help();

      expect(mockNotifications.alert).toHaveBeenCalledWith({
        title: 'Help',
        content: 'Example help text',
        type: DialogType.Alert,
      });
    });

    it('does not show an alert when the current page has no helpText', () => {
      const mockPage = { helpText: '' } as PageInterface;
      mockPageModel.getPage.and.returnValue(mockPage);

      examService.help();

      expect(mockNotifications.alert).not.toHaveBeenCalled();
    });
  });

  describe('gradeResponsesDefault', () => {
    it('leaves correct undefined when response area has no choices', () => {
      examService.results.currentPage.page = { id: 'test-page', responseArea: { type: 'textboxResponseArea' } };
      examService.gradeResponsesDefault();
      expect(examService.results.currentPage.correct).toBeUndefined();
    });

    it('sets correct to true when response matches the correct choice', () => {
      examService.results.currentPage.page = {
        id: 'test-page',
        responseArea: { type: 'multipleChoiceResponseArea', choices: [{ id: 'a', correct: true }] },
      };
      examService.results.currentPage.response = { selected: ['a'] };
      examService.gradeResponsesDefault();
      expect(examService.results.currentPage.correct).toBeTrue();
    });

    it('sets correct to false when response does not match the correct choice', () => {
      examService.results.currentPage.page = {
        id: 'test-page',
        responseArea: { type: 'multipleChoiceResponseArea', choices: [{ id: 'a', correct: true }] },
      };
      examService.results.currentPage.response = { selected: ['b'] };
      examService.gradeResponsesDefault();
      expect(examService.results.currentPage.correct).toBeFalse();
    });

    it('sets correct to true when response.selected is a scalar matching the correct choice (multiple-choice response area)', () => {
      examService.results.currentPage.page = {
        id: 'test-page',
        responseArea: { type: 'multipleChoiceResponseArea', choices: [{ id: 'a', correct: true }] },
      };
      examService.results.currentPage.response = { selected: 'a' };
      examService.gradeResponsesDefault();
      expect(examService.results.currentPage.correct).toBeTrue();
    });

    it('sets correct to false when response.selected is a scalar not matching the correct choice', () => {
      examService.results.currentPage.page = {
        id: 'test-page',
        responseArea: { type: 'multipleChoiceResponseArea', choices: [{ id: 'a', correct: true }] },
      };
      examService.results.currentPage.response = { selected: 'b' };
      examService.gradeResponsesDefault();
      expect(examService.results.currentPage.correct).toBeFalse();
    });
  });

  describe('isPageResponseRequired', () => {
    it('returns false when the page has no responseArea', () => {
      expect(examService.isPageResponseRequired({} as PageInterface)).toBeFalse();
    });

    it('returns true when responseRequired is explicitly true', () => {
      const page = { responseArea: { responseRequired: true, type: 'textboxResponseArea' } } as PageInterface;
      expect(examService.isPageResponseRequired(page)).toBeTrue();
    });

    it('returns false when responseRequired is explicitly false', () => {
      const page = { responseArea: { responseRequired: false, type: 'textboxResponseArea' } } as PageInterface;
      expect(examService.isPageResponseRequired(page)).toBeFalse();
    });
  });

  describe('preprocess function page overrides', () => {
    function buildPageWithPreprocess(js: string): PageDefinition {
      return {
        id: 'preprocess-page',
        instructionText: 'original text',
        responseArea: { type: 'textboxResponseArea', rows: 3, responseRequired: false },
        preProcessFunction: {
          filepath: 'test.js',
          function: 'testOverride',
          js,
        },
      } as unknown as PageDefinition;
    }

    it('applies overrides made via window.tabsint.page to the page passed to pageModel.updatePage', async () => {
      const page = buildPageWithPreprocess(
        'function testOverride() { window.tabsint.page.instructionText = "overridden text"; window.tabsint.page.responseArea.rows = 8; }'
      );

      await (examService as unknown as { initializeCurrentPage: (page: PageDefinition) => Promise<void> }).initializeCurrentPage(page);

      expect(mockPageModel.updatePage).toHaveBeenCalled();
      const renderedPage = mockPageModel.updatePage.calls.mostRecent().args[0] as PageDefinition;
      expect(renderedPage.instructionText).toBe('overridden text');
      expect((renderedPage.responseArea as { rows: number }).rows).toBe(8);
    });

    it('does not mutate the original page object', async () => {
      const page = buildPageWithPreprocess('function testOverride() { window.tabsint.page.instructionText = "overridden text"; }');

      await (examService as unknown as { initializeCurrentPage: (page: PageDefinition) => Promise<void> }).initializeCurrentPage(page);

      expect(page.instructionText).toBe('original text');
    });

    it('waits for an async preprocess function to reassign a wavfile path before rendering the page, and resolves _resolvedPath automatically', async () => {
      examService.protocol.activeProtocol = {
        ...examService.protocol.activeProtocol,
        server: ProtocolServer.Developer,
        path: 'my-protocol',
      } as never;

      const page = buildPageWithPreprocess(
        `async function testOverride() {
          await Promise.resolve();
          window.tabsint.page.wavfiles[0].path = 'new.wav';
        }`
      );
      page.wavfiles = [{ path: 'original.wav', useCommonRepo: false, _resolvedPath: 'public/assets/my-protocol/original.wav' }];

      const initializeCurrentPage = (
        examService as unknown as { initializeCurrentPage: (page: PageDefinition) => Promise<void> }
      ).initializeCurrentPage.bind(examService);
      const initializePromise = initializeCurrentPage(page);

      // pageModel.updatePage must not be called until the async preprocess function resolves.
      expect(mockPageModel.updatePage).not.toHaveBeenCalled();

      await initializePromise;

      expect(mockPageModel.updatePage).toHaveBeenCalled();
      const renderedPage = mockPageModel.updatePage.calls.mostRecent().args[0] as PageDefinition;
      expect(renderedPage.wavfiles![0].path).toBe('new.wav');
      expect(renderedPage.wavfiles![0]._resolvedPath).toBe('public/assets/my-protocol/new.wav');
    });

    it('resolves _resolvedPath for a page with wavfiles and no preprocess function', async () => {
      examService.protocol.activeProtocol = {
        ...examService.protocol.activeProtocol,
        server: ProtocolServer.Developer,
        path: 'my-protocol',
      } as never;

      const page: PageDefinition = {
        id: 'no-preprocess-page',
        responseArea: { type: 'textboxResponseArea', rows: 3, responseRequired: false },
        wavfiles: [{ path: 'plain.wav', useCommonRepo: false }],
      } as unknown as PageDefinition;

      await (examService as unknown as { initializeCurrentPage: (page: PageDefinition) => Promise<void> }).initializeCurrentPage(page);

      const renderedPage = mockPageModel.updatePage.calls.mostRecent().args[0] as PageDefinition;
      expect(renderedPage.wavfiles![0]._resolvedPath).toBe('public/assets/my-protocol/plain.wav');
    });

    it('resolves _resolvedPath for a page video with no preprocess function, without the wavfile "public/" prefix', async () => {
      examService.protocol.activeProtocol = {
        ...examService.protocol.activeProtocol,
        server: ProtocolServer.Developer,
        path: 'my-protocol',
      } as never;

      const page: PageDefinition = {
        id: 'video-page',
        responseArea: { type: 'textboxResponseArea', rows: 3, responseRequired: false },
        video: { path: 'clip.mp4' },
      } as unknown as PageDefinition;

      await (examService as unknown as { initializeCurrentPage: (page: PageDefinition) => Promise<void> }).initializeCurrentPage(page);

      const renderedPage = mockPageModel.updatePage.calls.mostRecent().args[0] as PageDefinition;
      expect(renderedPage.video!._resolvedPath).toBe('assets/my-protocol/clip.mp4');
    });

    it('re-resolves a video path reassigned by a preprocess function', async () => {
      examService.protocol.activeProtocol = {
        ...examService.protocol.activeProtocol,
        server: ProtocolServer.Developer,
        path: 'my-protocol',
      } as never;

      const page = buildPageWithPreprocess(`function testOverride() { window.tabsint.page.video.path = 'new-clip.mp4'; }`);
      page.video = { path: 'original-clip.mp4' };

      await (examService as unknown as { initializeCurrentPage: (page: PageDefinition) => Promise<void> }).initializeCurrentPage(page);

      const renderedPage = mockPageModel.updatePage.calls.mostRecent().args[0] as PageDefinition;
      expect(renderedPage.video!.path).toBe('new-clip.mp4');
      expect(renderedPage.video!._resolvedPath).toBe('assets/my-protocol/new-clip.mp4');
    });
  });

  describe('page reinitialization (stack navigation)', () => {
    function buildPage(): PageDefinition {
      return {
        id: 'reinit-page',
        instructionText: 'text',
        responseArea: { type: 'textboxResponseArea', rows: 3, responseRequired: false },
      } as unknown as PageDefinition;
    }

    it('assigns a fresh _uuid to the rendered page', async () => {
      const page = buildPage();

      await (examService as unknown as { initializeCurrentPage: (page: PageDefinition) => Promise<void> }).initializeCurrentPage(page);

      const renderedPage = mockPageModel.updatePage.calls.mostRecent().args[0] as PageInterface;
      expect(renderedPage._uuid).toBeTruthy();
    });

    it('assigns a new _uuid on every call, even for the exact same page reference navigated to twice in a row', async () => {
      // Simulates re-entering the same subprotocol/page during stack navigation (e.g. a followOn
      // that loops back onto the same reference), where the identical PageDefinition object is
      // initialized again without any different page in between.
      const page = buildPage();
      const initializeCurrentPage = (
        examService as unknown as { initializeCurrentPage: (page: PageDefinition) => Promise<void> }
      ).initializeCurrentPage.bind(examService);

      await initializeCurrentPage(page);
      const firstRenderedPage = mockPageModel.updatePage.calls.mostRecent().args[0] as PageInterface;

      await initializeCurrentPage(page);
      const secondRenderedPage = mockPageModel.updatePage.calls.mostRecent().args[0] as PageInterface;

      expect(firstRenderedPage.id).toBe(secondRenderedPage.id);
      expect(secondRenderedPage._uuid).not.toBe(firstRenderedPage._uuid);
    });
  });

  describe('protocol nMaxPages timeout enforcement', () => {
    function buildPage(id: string): PageDefinition {
      return {
        id,
        instructionText: 'text',
        responseArea: { type: 'textboxResponseArea', rows: 3, responseRequired: false },
      } as unknown as PageDefinition;
    }

    function useTimedProtocol(showAlert?: boolean) {
      const timedProtocol = {
        protocolId: 'timed-protocol',
        name: 'Timed Protocol',
        date: new Date().toISOString(),
        version: '1.0',
        server: ProtocolServer.LocalServer,
        admin: true,
        timeout: { nMaxPages: 2, showAlert },
        pages: [buildPage('p1'), buildPage('p2'), buildPage('p3')],
      };
      examService.protocol.activeProtocol = timedProtocol;
      examService.protocol.activeProtocolStack = new ProtocolStack();
      examService.protocol.activeProtocolDictionary = { 'timed-protocol': timedProtocol };
    }

    it('ends the protocol once nMaxPages is reached, without showing pages beyond the limit', async () => {
      useTimedProtocol();
      spyOn(examService, 'endExam' as never);

      await examService.begin();
      expect(mockPageModel.updatePage).toHaveBeenCalledTimes(1);
      expect((mockPageModel.updatePage.calls.argsFor(0)[0] as PageInterface).id).toBe('p1');

      await examService.submitDefault();
      expect(mockPageModel.updatePage).toHaveBeenCalledTimes(2);
      expect((mockPageModel.updatePage.calls.argsFor(1)[0] as PageInterface).id).toBe('p2');

      await examService.submitDefault();
      expect(mockPageModel.updatePage).toHaveBeenCalledTimes(2);
      expect(examService['endExam' as keyof ExamService]).toHaveBeenCalled();
    });

    it('alerts the user on timeout only when the protocol requests it', async () => {
      useTimedProtocol(true);
      spyOn(examService, 'endExam' as never);

      await examService.begin();
      await examService.submitDefault();
      await examService.submitDefault();

      expect(mockNotifications.alert).toHaveBeenCalled();
    });

    it('does not alert the user on timeout when the protocol does not request it', async () => {
      useTimedProtocol(false);
      spyOn(examService, 'endExam' as never);

      await examService.begin();
      await examService.submitDefault();
      await examService.submitDefault();

      expect(mockNotifications.alert).not.toHaveBeenCalled();
    });
  });

  describe('protocol reference navigation', () => {
    function buildPage(id: string): PageDefinition {
      return {
        id,
        instructionText: 'text',
        responseArea: { type: 'textboxResponseArea', rows: 3, responseRequired: false },
      } as unknown as PageDefinition;
    }

    it('does not skip the page following a protocol reference once the referenced sub-protocol completes', async () => {
      const subProtocol = {
        protocolId: 'sub',
        name: 'Sub Protocol',
        date: new Date().toISOString(),
        version: '1.0',
        server: ProtocolServer.LocalServer,
        admin: true,
        pages: [buildPage('sub_page')],
      };
      const rootProtocol = {
        protocolId: 'root-protocol',
        name: 'Root Protocol',
        date: new Date().toISOString(),
        version: '1.0',
        server: ProtocolServer.LocalServer,
        admin: true,
        pages: [buildPage('intro'), { reference: 'sub' }, buildPage('after_sub_1'), buildPage('after_sub_2')],
      };
      examService.protocol.activeProtocol = rootProtocol as never;
      examService.protocol.activeProtocolStack = new ProtocolStack();
      examService.protocol.activeProtocolDictionary = { sub: subProtocol } as never;

      await examService.begin();
      await examService.submitDefault(); // intro -> reference pushes sub protocol -> sub_page
      await examService.submitDefault(); // sub_page -> sub protocol completes, pops back to root

      const shownIds = mockPageModel.updatePage.calls.allArgs().map(args => (args[0] as PageInterface).id);
      expect(shownIds).toEqual(['intro', 'sub_page', 'after_sub_1']);

      await examService.submitDefault();
      const shownIdsAfterNext = mockPageModel.updatePage.calls.allArgs().map(args => (args[0] as PageInterface).id);
      expect(shownIdsAfterNext).toEqual(['intro', 'sub_page', 'after_sub_1', 'after_sub_2']);
    });
  });

  describe('updateExamProgress', () => {
    it('sets progress to 0 when protocol is undefined', () => {
      examService.updateExamProgress(undefined);
      expect(mockStateModel.updateState).toHaveBeenCalledWith({ examProgress: 0 });
    });

    it('sets progress to 0 when protocol has not started (pageIndex is -1)', () => {
      const notStarted: ProtocolStackItem = {
        protocolId: '',
        pageQueue: [{}] as PageTypes[],
        pageIndex: -1,
        maxPages: 10,
        maxSeconds: 60,
        startTime: new Date(),
        showProgressBar: false,
      };
      examService.updateExamProgress(notStarted);
      expect(mockStateModel.updateState).toHaveBeenCalledWith({ examProgress: 0 });
    });

    it('calculates progress as a percentage when protocol is active', () => {
      const protocol: ProtocolStackItem = {
        protocolId: '',
        pageQueue: [{ id: 'p1' }, { id: 'p2' }, { id: 'p3' }] as PageTypes[],
        pageIndex: 0,
        maxPages: Number.MAX_SAFE_INTEGER,
        maxSeconds: Number.MAX_SAFE_INTEGER,
        startTime: new Date(),
        showProgressBar: false,
      };
      examService.updateExamProgress(protocol);
      const call = mockStateModel.updateState.calls.mostRecent();
      const progress = (call.args[0] as Partial<StateInterface>).examProgress;
      expect(progress).toBeGreaterThan(0);
      expect(progress).toBeLessThanOrEqual(100);
    });
  });
});
