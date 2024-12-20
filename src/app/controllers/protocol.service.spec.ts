import { TestBed } from '@angular/core/testing';
import { ProtocolService } from './protocol.service';
import { ProtocolModel } from '../models/protocol/protocol-model.service';
import { SqLite } from '../utilities/sqLite.service';
import { DiskModel } from '../models/disk/disk.service';
import { FileService } from '../utilities/file.service';
import { Logger } from '../utilities/logger.service';
import { AppModel } from '../models/app/app.service';
import { ProtocolServer } from '../utilities/constants';
import { StateModel } from '../models/state/state.service';
import { TranslateFakeLoader, TranslateLoader, TranslateModule, TranslateService, TranslateStore } from '@ngx-translate/core';
import { Tasks } from '../utilities/tasks.service';
import { Notifications } from '../utilities/notifications.service';
import { MatDialog } from '@angular/material/dialog';
import { ProtocolInterface } from '../models/protocol/protocol.interface';
import { partialMetaDefaults } from '../utilities/defaults';

describe('ProtocolService', () => {
    let protocolService: ProtocolService;
    let appModel = new AppModel;
    let diskModel = new DiskModel(new Document);
    let sqLite = new SqLite(appModel, diskModel);
    let logger = new Logger(diskModel, sqLite);
    let stateModel = new StateModel;
    let tasks = new Tasks;

    const spy = jasmine.createSpyObj('MatDialog', ['open']);

    let testProtocol = {
        date: new Date().toJSON(),
        version: '0.0',
        server: ProtocolServer.LocalServer,
        admin: false,
        creator: "Creare",
        name: "test",
        path: "na",
        title: "test Protocol",
        pages: [
                {
                "id": "textbox_003",
                "title": "Text Box",
                "instructionText": "Test Cases 003",
                "responseArea": {
                    "type": "textboxResponseArea"
                }
            }
        ]
    };
    let badTestProtocol = {
        date: new Date().toJSON(),
        version: '0.0',
        server: ProtocolServer.LocalServer,
        admin: false,
        creator: "Creare",
        name: "badTest",
        path: "na",
        title: "test Protocol"
    };
    let developProtocolMeta = 
        {
            ...partialMetaDefaults,
            creator: "Creare",
            name: "develop",
            path: "protocols/develop"
        }

          
    beforeEach(async () => {
        TestBed.configureTestingModule({
            imports: [
              TranslateModule.forRoot({
                  loader: {
                    provide: TranslateLoader,
                    useClass: TranslateFakeLoader
                  }
                }),
            ],
            providers: [
              Notifications,
              { provide: MatDialog, useValue: spy },
              TranslateService, 
              TranslateStore
            ]
        })

        let mockTranslateService = {
            get: jasmine.createSpy('get').and.callFake((key: string) => ({
                subscribe: (callback: (value: string) => void) => callback(key),
            })),
            instant: jasmine.createSpy('instant').and.callFake((key: string) => key),
            use: jasmine.createSpy('use').and.callFake((lang: string) => { }),
        } as unknown as TranslateService;

        protocolService = new ProtocolService(
            appModel,
            diskModel,
            new FileService(appModel, logger,diskModel),
            logger,
            new Notifications(spy),
            new ProtocolModel,
            stateModel,
            mockTranslateService,
            tasks
        );
    })

    it('load all protocol onto the protocolModel.activeProtocol object', async () => {
        let activeProtocol: ProtocolInterface|undefined = protocolService.protocolModel.activeProtocol;
        expect(activeProtocol).toBeUndefined();        
        await protocolService.load(protocolService.disk.availableProtocolsMeta['develop']);
        activeProtocol = protocolService.protocolModel.activeProtocol;
        expect(activeProtocol).toBeDefined();
        expect(activeProtocol?.pages.length).toBeGreaterThan(0);
    });

    it('initializes protocol', async () => {
        await protocolService.load(protocolService.disk.availableProtocolsMeta['develop']);
        expect(protocolService.protocolModel.activeProtocolDictionary).toBeDefined();
        expect(protocolService.protocolModel.activeProtocolFollowOnsDictionary).toBeDefined();
        expect(protocolService.state.examIndex).toEqual(0);
        expect(protocolService.state.examState).toEqual(2);
    });

    it('cannot remove a Developer protocol from TabSINT from the disk model', () => {
        expect(Object.keys(protocolService.disk.availableProtocolsMeta).length).toEqual(2);
        expect(protocolService.disk.availableProtocolsMeta['develop'].name).toBe('develop');
        protocolService.delete(developProtocolMeta);
        expect(Object.keys(protocolService.disk.availableProtocolsMeta).length).toEqual(2);
        expect(protocolService.disk.availableProtocolsMeta['develop']).toBeDefined();
    });

    it('removes a local server protocol from TabSINT from the disk model', () => {
        protocolService.disk.availableProtocolsMeta['test'] = testProtocol;
        expect(Object.keys(protocolService.disk.availableProtocolsMeta).length).toEqual(3);
        expect(protocolService.disk.availableProtocolsMeta['test'].name).toBe('test');
        protocolService.delete(testProtocol);
        expect(Object.keys(protocolService.disk.availableProtocolsMeta).length).toEqual(2);
        expect(protocolService.disk.availableProtocolsMeta['test']).toBeUndefined();
    });

    it('throws an error if the protocol does not meet schema', async () => {
        protocolService.disk.availableProtocolsMeta['badTest'] = badTestProtocol;
        try {
            await protocolService.load(protocolService.disk.availableProtocolsMeta['badTest']);
            fail('Expected function to throw an error, but it did not.');
        } catch (error) {
            expect(error).toBeDefined();
        }
        protocolService.delete(badTestProtocol);
    });

    it('puts validation error on active protocol if the protocol does not meet schema', async () => {
        protocolService.disk.availableProtocolsMeta['badTest'] = badTestProtocol;
        try {
            await protocolService.load(protocolService.disk.availableProtocolsMeta['badTest']);
        } catch {
        }
        expect(protocolService.protocolModel.activeProtocol?.errors?.length).toBeGreaterThan(0);
        protocolService.delete(badTestProtocol);
    });

})
