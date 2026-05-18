import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ProtocolService } from './protocol.service';
import { DiskModel } from '../models/disk/disk.service';
import { ProtocolServer } from '../utilities/constants';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { Notifications } from '../services/notifications.service';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ProtocolInterface } from '../models/protocol/protocol.interface';
import { partialMetaDefaults } from '../utilities/defaults';
import { Component } from '@angular/core';

describe('ProtocolService', () => {
  let diskModel: DiskModel;
  let matDialogSpy: jasmine.SpyObj<MatDialog>;

  const testProtocol = {
    date: new Date().toJSON(),
    version: '0.0',
    server: ProtocolServer.LocalServer,
    admin: false,
    creator: 'Creare',
    name: 'test',
    path: 'na',
    title: 'test Protocol',
    pages: [
      {
        id: 'textbox_003',
        title: 'Text Box',
        instructionText: 'Test Cases 003',
        responseArea: {
          type: 'textboxResponseArea',
        },
      },
    ],
  };
  const badTestProtocol = {
    date: new Date().toJSON(),
    version: '0.0',
    server: ProtocolServer.LocalServer,
    admin: false,
    creator: 'Creare',
    name: 'badTest',
    path: 'na',
    title: 'test Protocol',
  };
  const developProtocolMeta = {
    ...partialMetaDefaults,
    creator: 'Creare',
    name: 'develop',
    path: 'protocols/develop',
  };

  beforeEach(async () => {
    matDialogSpy = jasmine.createSpyObj('MatDialog', ['open']);
    matDialogSpy.open.and.returnValue({
      afterClosed: () => of(true),
    } as MatDialogRef<Component>);

    TestBed.configureTestingModule({
      imports: [
        TranslocoTestingModule.forRoot({ langs: { en: {} }, translocoConfig: { availableLangs: ['en'], defaultLang: 'en' }, preloadLangs: true }),
      ],
      providers: [Notifications, { provide: MatDialog, useValue: matDialogSpy }, DiskModel],
    });

    diskModel = TestBed.inject(DiskModel);
    if (!diskModel.disk.availableProtocolsMeta) {
      diskModel.disk.availableProtocolsMeta = {};
    }
    diskModel.disk.availableProtocolsMeta['develop'] = developProtocolMeta;
  });

  it('load all protocol onto the protocolModel.activeProtocol object', async () => {
    const protocolService = TestBed.inject(ProtocolService);
    let activeProtocol: ProtocolInterface | undefined = protocolService.protocolModel.activeProtocol;
    expect(activeProtocol).toBeUndefined();
    await protocolService.load(protocolService.disk.availableProtocolsMeta['develop']);
    activeProtocol = protocolService.protocolModel.activeProtocol;
    expect(activeProtocol).toBeDefined();
    expect(activeProtocol?.pages.length).toBeGreaterThan(0);
  });

  it('initializes protocol', async () => {
    const protocolService = TestBed.inject(ProtocolService);
    await protocolService.load(protocolService.disk.availableProtocolsMeta['develop']);
    expect(protocolService.protocolModel.activeProtocolDictionary).toBeDefined();
    expect(protocolService.protocolModel.activeProtocolFollowOnsDictionary).toBeDefined();
    expect(protocolService.state.examState).toEqual(2);
  });

  it('cannot remove a Developer protocol from TabSINT from the disk model', () => {
    const protocolService = TestBed.inject(ProtocolService);
    const initialCount = Object.keys(protocolService.disk.availableProtocolsMeta).length;
    expect(initialCount).toBeGreaterThanOrEqual(1);
    expect(protocolService.disk.availableProtocolsMeta['develop']).toBeDefined();
    expect(protocolService.disk.availableProtocolsMeta['develop'].name).toBe('develop');

    protocolService.delete(developProtocolMeta);

    const finalCount = Object.keys(protocolService.disk.availableProtocolsMeta).length;
    expect(finalCount).toEqual(initialCount);
    expect(protocolService.disk.availableProtocolsMeta['develop']).toBeDefined();
  });

  it('removes a local server protocol from TabSINT from the disk model', () => {
    const protocolService = TestBed.inject(ProtocolService);
    protocolService.disk.availableProtocolsMeta['test'] = testProtocol;
    const initialCount = Object.keys(protocolService.disk.availableProtocolsMeta).length;
    expect(protocolService.disk.availableProtocolsMeta['test']).toBeDefined();
    expect(protocolService.disk.availableProtocolsMeta['test'].name).toBe('test');

    protocolService.delete(testProtocol);

    const finalCount = Object.keys(protocolService.disk.availableProtocolsMeta).length;
    expect(finalCount).toEqual(initialCount - 1);
    expect(protocolService.disk.availableProtocolsMeta['test']).toBeUndefined();
  });

  it('throws an error if the protocol does not meet schema', async () => {
    const protocolService = TestBed.inject(ProtocolService);
    protocolService.disk.availableProtocolsMeta['badTest'] = badTestProtocol;
    try {
      await protocolService.load(protocolService.disk.availableProtocolsMeta['badTest']);
    } catch {
      // Expected to fail
    }
    expect(protocolService.protocolModel.activeProtocol).toBeUndefined();
    protocolService.delete(badTestProtocol);
  });

  it('puts validation error on active protocol if the protocol does not meet schema', async () => {
    const protocolService = TestBed.inject(ProtocolService);
    protocolService.disk.availableProtocolsMeta['badTest'] = badTestProtocol;
    try {
      await protocolService.load(protocolService.disk.availableProtocolsMeta['badTest']);
    } catch {
      /* empty */
    }
    expect(protocolService.protocolModel.activeProtocol).toBeUndefined();
    protocolService.delete(badTestProtocol);
  });

  it('puts validation error on active protocol if the protocol has calibration errors', async () => {
    const protocolService = TestBed.inject(ProtocolService);
    const protocol = testProtocol;
    const badPages = [
      {
        id: 'textbox',
        title: 'Text Box',
        instructionText: 'Test Cases',
        wavfiles: [
          {
            weighting: 'A',
            path: 'path.wav',
            targetSPL: 65,
          },
        ],
        responseArea: {
          type: 'textboxResponseArea',
        },
      },
    ];
    protocol.pages = badPages;
    protocolService.disk.availableProtocolsMeta['badTest'] = protocol;

    try {
      await protocolService.load(protocolService.disk.availableProtocolsMeta['badTest']);
    } catch {
      /* empty */
    }
    expect(protocolService.protocolModel.activeProtocol).toBeUndefined();
    protocolService.delete(badTestProtocol);
  });
});
