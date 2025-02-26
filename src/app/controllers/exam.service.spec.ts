import {TestBed} from '@angular/core/testing';
import { ExamService } from './exam.service';
import { ResultsService } from './results.service';
import { ResultsModel } from '../models/results/results-model.service';
import { ProtocolModel } from '../models/protocol/protocol-model.service';
import { PageModel } from '../models/page/page.service';
import { StateModel } from '../models/state/state.service';
import { Notifications } from '../utilities/notifications.service';
import { Logger } from '../utilities/logger.service';
import { AppState, DeviceState, ExamState, ProtocolServer, ProtocolState } from '../utilities/constants';
import { BehaviorSubject, of } from 'rxjs';
import { PageInterface } from '../models/page/page.interface';

describe('ExamService', () => {
    let examService: ExamService;
    let mockResultsService: jasmine.SpyObj<ResultsService>;
    let mockResultsModel: jasmine.SpyObj<ResultsModel>;
    let mockPageModel: jasmine.SpyObj<PageModel>;
    let mockProtocolModel: jasmine.SpyObj<ProtocolModel>;
    let mockStateModel: jasmine.SpyObj<StateModel>;
    let mockNotifications: jasmine.SpyObj<Notifications>;
    let mockLogger: jasmine.SpyObj<Logger>;

    beforeEach(() => {
        mockResultsService = jasmine.createSpyObj('ResultsService', ['initializeExamResults', 'pushResults', 'save','initializePageResults']);
        mockResultsModel = jasmine.createSpyObj('ResultsModel', ['getResults']);
        mockPageModel = jasmine.createSpyObj('PageModel', ['getPage', 'stack']);
        mockPageModel.currentPageSubject = new BehaviorSubject({}) as any;
    
        mockProtocolModel = jasmine.createSpyObj('ProtocolModel', ['getProtocolModel']);
        mockProtocolModel.getProtocolModel.and.returnValue({ activeProtocol: undefined });
        const mockProtocol = {
            activeProtocol: undefined
        };
        mockProtocolModel.getProtocolModel.and.returnValue(mockProtocol);
        mockStateModel = jasmine.createSpyObj('StateModel', ['getState', 'setPageSubmittable']);
        mockStateModel.getState.and.returnValue({
            examState: ExamState.Ready,
            appState: {
                someAppStateProperty: 'mockValue'
            } as unknown as AppState,
        
            protocolState: {
                someProtocolProperty: 'mockValue'
            } as unknown as ProtocolState,
        
            deviceError: [],
        
            doesResponseExist: false,
            isResponseRequired: false,
            isSubmittable: false,
            examIndex: 0,
        
            canGoBack: () => true,
        
            isPaneOpen: {
                general: false,
                advanced: false,
                devices: false,
                tympans: false,
                dosimeter: false,
                softwareHardware: false,
                appLog: false,
                protocols: false,
                protocolsSource: false,
                deviceAdvanced: false,
                completedExams: false,
                exportedAndUploadedResults: false
            },
        
            examProgress: {
                pctProgress: 0,
                anticipatedProtocols: [],
                activatedProtocols: []
            },
        
            bluetoothConnected: true,
            wifiConnected: true,
            newDeviceConnection: false
        });
        
        mockResultsModel.getResults.and.returnValue({
            currentPage: {
                pageId: 'test-page',
                page: {} 
            },
            currentExam: {
                protocolName: 'Test Protocol',
                protocolId: '12345',
                protocol: {
                    name: 'Test Protocol',
                    date: new Date().toISOString(),
                    version: '1.0',
                    server: ProtocolServer.LocalServer,
                    admin: true,
                    pages: []
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
                        capacitor: '3.2.0'
                    },
                    plugins: ['plugin1', 'plugin2']
                },
        
                tabletLocation: {
                    latitude: 37.7749,
                    longitude: -122.4194,
                    accuracy: 5
                },
                headset: 'Test Headset',
                calibrationVersion: 'v1.2',
                devices: {
                    build: '2024.01',
                    uuid: 'device-uuid-123',
                    version: '1.0.3',
                    platform: 'Android',
                    model: 'Galaxy Tab S7',
                    os: 'Android 11',
                    other: 'Some other info',
                    diskspace: '64GB',
                    connectedDevices: {
                        tympan: [
                            {
                                type: 'hearing-device',
                                tabsintId: 'tym-001',
                                description: 'Test Tympan Device',
                                buildDateTime: new Date().toISOString(),
                                serialNumber: 'SN-12345',
                                deviceId: 'dev-001',
                                name: 'Tympan Device',
                                state: DeviceState.Connected,
                                msgId: 123
                            }
                        ],
                        cha: [{}], 
                        svantek: [{}]
                    }
                }
            }
        });
        
        mockProtocolModel.getProtocolModel.and.returnValue({
            activeProtocol: {
                name: 'Test Protocol',
                date: new Date().toISOString(),
                version: '1.0',
                server: ProtocolServer.LocalServer,
                admin: true,
                pages: []
            }
        });

        mockNotifications = jasmine.createSpyObj('Notifications', ['alert']);
        mockNotifications.alert.and.returnValue(of('OK'));
        mockLogger = jasmine.createSpyObj('Logger', ['debug']);
        
        TestBed.configureTestingModule({
            providers: [
                ExamService,
                { provide: ResultsService, useValue: mockResultsService },
                { provide: ResultsModel, useValue: mockResultsModel },
                { provide: PageModel, useValue: mockPageModel },
                { provide: ProtocolModel, useValue: mockProtocolModel },
                { provide: StateModel, useValue: mockStateModel },
                { provide: Notifications, useValue: mockNotifications },
                { provide: Logger, useValue: mockLogger }
            ]
        });

        examService = TestBed.inject(ExamService);
    });

    it('should be created', () => {
        expect(examService).toBeTruthy();
    });

    it('should begin the exam and set exam state to Testing', async () => {
        mockProtocolModel.getProtocolModel.and.returnValue({
            activeProtocol: {
                name: 'Test Protocol',
                date: new Date().toISOString(),
                version: '1.0',
                server: ProtocolServer.LocalServer,
                admin: true,
                pages: []
            }
        });
    
        mockPageModel.getPage.and.returnValue({
            id: 'test-page',
            responseArea: { responseRequired: false, type: 'text' }
        });
        
        mockPageModel.currentPageSubject = new BehaviorSubject<PageInterface>({
            id: 'test-page',
            responseArea: {
                responseRequired: false,
                type: 'text'
            },
            title: 'Mock Page',
            questionMainText: '',
            questionSubText: '',
            instructionText: '',
            helpText: '',
            submitText: ''
        } as PageInterface);
    
        mockPageModel.stack = [];
    
        await examService.begin();
    
        expect(mockResultsService.initializeExamResults).toHaveBeenCalled();
    });

    it('should submit the default response and advance the page', () => {
        mockResultsService.pushResults.and.stub();
        spyOn<any>(examService, 'advancePage');
        
        examService.submitDefault();
        expect(mockResultsService.pushResults).toHaveBeenCalled();
        expect(examService["advancePage" as keyof ExamService]).toHaveBeenCalled();
    });

    it('should reset the exam state to Ready when reset is called', () => {
        examService.reset();
        expect(mockStateModel.getState().examState).toEqual(ExamState.Ready);
    });

    it('should submit partial results and advance page', () => {
        spyOn<any>(examService, 'advancePage');

        examService.submitPartial();
        expect(examService["advancePage" as keyof ExamService]).toHaveBeenCalled();
    });

    it('should navigate to target protocol and submit default', () => {
        spyOn<any>(examService, 'submitDefault');

        examService.navigateToTarget('test-protocol');
        expect(examService["submitDefault" as keyof ExamService]).toHaveBeenCalled();
    });

    it('should determine if a page response is required', () => {
        const mockPage = {
            responseArea: { responseRequired: undefined, type: 'text' }
        } as any;
        mockPageModel.getPage.and.returnValue(mockPage);
        spyOn<any>(examService, 'isPageResponseRequired').and.callThrough();
        
        expect(examService.isPageResponseRequired()).toBeDefined();
    });
});
