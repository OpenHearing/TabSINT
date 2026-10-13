import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { of } from 'rxjs';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';

import { ProtocolsComponent } from './protocols.component';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatMenuModule } from '@angular/material/menu';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule } from '@angular/forms';
import { DiskModel } from '../../models/disk/disk.service';
import { FileService } from '../../services/file.service';
import { GitlabService } from '../../services/gitlab.service';
import { MediaRepositoryService } from '../../services/media-repository.service';
import { ProtocolService } from '../../controllers/protocol.service';
import { Notifications } from '../../services/notifications.service';
import { GitlabReferenceDialog } from '../gitlab-reference-dialog/gitlab-reference-dialog.component';
import { MediaUpdateStatus, ProtocolServer } from '../../utilities/constants';
import { partialMetaDefaults } from '../../utilities/defaults';
import { GitlabConfigInterface } from '../../models/disk/disk.interface';
import { ProtocolMetaInterface } from '../../models/protocol/protocol.interface';

describe('ProtocolsComponent', () => {
  let component: ProtocolsComponent;
  let fixture: ComponentFixture<ProtocolsComponent>;
  let diskModel: DiskModel;
  let fileServiceSpy: jasmine.SpyObj<FileService>;
  let gitlabServiceSpy: jasmine.SpyObj<GitlabService>;
  let mediaRepositoryServiceSpy: jasmine.SpyObj<MediaRepositoryService>;
  let protocolServiceSpy: jasmine.SpyObj<ProtocolService>;
  let notificationsSpy: jasmine.SpyObj<Notifications>;
  let dialogSpy: jasmine.SpyObj<MatDialog>;

  const gitlabConfig: GitlabConfigInterface = {
    host: 'https://gitlab.com/',
    group: 'group',
    repository: 'repo',
    token: 'token',
    tag: '',
  };

  function dialogRefReturning(result: unknown): MatDialogRef<unknown> {
    return { afterClosed: () => of(result) } as MatDialogRef<unknown>;
  }

  beforeEach(async () => {
    fileServiceSpy = jasmine.createSpyObj('FileService', ['launchFileChooser', 'listDirectory', 'readFile']);
    gitlabServiceSpy = jasmine.createSpyObj('GitlabService', ['getLatestReference', 'downloadGitlabRepository']);
    mediaRepositoryServiceSpy = jasmine.createSpyObj('MediaRepositoryService', ['processCommonMedia', 'notifyStatus']);
    mediaRepositoryServiceSpy.processCommonMedia.and.resolveTo(MediaUpdateStatus.Skipped);
    mediaRepositoryServiceSpy.notifyStatus.and.resolveTo();
    protocolServiceSpy = jasmine.createSpyObj('ProtocolService', ['load']);
    notificationsSpy = jasmine.createSpyObj('Notifications', ['alert']);
    notificationsSpy.alert.and.returnValue(of('OK'));
    dialogSpy = jasmine.createSpyObj('MatDialog', ['open']);
    dialogSpy.open.and.returnValue(dialogRefReturning(GitlabReferenceDialog.OPTION_TAG));

    await TestBed.configureTestingModule({
      declarations: [ProtocolsComponent],
      imports: [
        MatExpansionModule,
        MatMenuModule,
        BrowserAnimationsModule,
        FormsModule,
        TranslocoTestingModule.forRoot({ langs: { en: {} }, translocoConfig: { availableLangs: ['en'], defaultLang: 'en' }, preloadLangs: true }),
      ],
      providers: [
        DiskModel,
        { provide: FileService, useValue: fileServiceSpy },
        { provide: GitlabService, useValue: gitlabServiceSpy },
        { provide: MediaRepositoryService, useValue: mediaRepositoryServiceSpy },
        { provide: ProtocolService, useValue: protocolServiceSpy },
        { provide: Notifications, useValue: notificationsSpy },
        { provide: MatDialog, useValue: dialogSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProtocolsComponent);
    component = fixture.componentInstance;
    diskModel = TestBed.inject(DiskModel);
    if (!diskModel.disk.availableProtocolsMeta) {
      diskModel.disk.availableProtocolsMeta = {};
    }
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('addProtocols', () => {
    beforeEach(() => {
      fileServiceSpy.launchFileChooser.and.resolveTo({ uri: 'folder://new', name: 'newProto' });
      fileServiceSpy.listDirectory.and.resolveTo({
        files: [
          {
            name: 'protocol.json',
            uri: 'folder://new/protocol.json',
            mimeType: 'application/json',
            size: 10,
            content: JSON.stringify({ title: 'New Protocol', pages: [] }),
          },
        ],
      });
    });

    it('removes a newly added protocol from the list when validation fails', async () => {
      protocolServiceSpy.load.and.resolveTo(false);

      await component.addProtocols();

      expect(component.disk.availableProtocolsMeta['newProto']).toBeUndefined();
    });

    it('keeps a newly added protocol in the list when validation succeeds', async () => {
      protocolServiceSpy.load.and.resolveTo(true);

      await component.addProtocols();

      expect(component.disk.availableProtocolsMeta['newProto']).toBeDefined();
    });
  });

  describe('fetchGitlabProtocol', () => {
    beforeEach(() => {
      gitlabServiceSpy.getLatestReference.and.resolveTo('v1');
      gitlabServiceSpy.downloadGitlabRepository.and.resolveTo('folder://repo');
      fileServiceSpy.readFile.and.resolveTo({
        contentUri: 'folder://repo/protocol.json',
        mimeType: 'application/json',
        name: 'protocol.json',
        size: 10,
        content: JSON.stringify({ title: 'Repo Protocol', pages: [] }),
      });
    });

    it('rolls back a new gitlab import and skips the success alert when validation fails', async () => {
      protocolServiceSpy.load.and.resolveTo(false);

      await component.fetchGitlabProtocol(gitlabConfig, false);

      expect(component.disk.availableProtocolsMeta['repo']).toBeUndefined();
      expect(notificationsSpy.alert.calls.allArgs().some(args => args[0].title === 'Success')).toBeFalse();
    });

    it('keeps a new gitlab import and shows the success alert when validation succeeds', async () => {
      protocolServiceSpy.load.and.resolveTo(true);

      await component.fetchGitlabProtocol(gitlabConfig, false);

      expect(component.disk.availableProtocolsMeta['repo']).toBeDefined();
      expect(notificationsSpy.alert.calls.allArgs().some(args => args[0].title === 'Success')).toBeTrue();
    });
  });

  describe('update', () => {
    let previousMeta: ProtocolMetaInterface;

    beforeEach(() => {
      previousMeta = {
        ...partialMetaDefaults,
        name: 'repo',
        path: 'na',
        server: ProtocolServer.Gitlab,
        gitlabConfig: { ...gitlabConfig, tag: 'v0' },
      };
      component.disk.availableProtocolsMeta['repo'] = previousMeta;
      component.selected = previousMeta;

      gitlabServiceSpy.getLatestReference.and.resolveTo('v1');
      gitlabServiceSpy.downloadGitlabRepository.and.resolveTo('folder://repo-v1');
      fileServiceSpy.readFile.and.resolveTo({
        contentUri: 'folder://repo-v1/protocol.json',
        mimeType: 'application/json',
        name: 'protocol.json',
        size: 10,
        content: JSON.stringify({ title: 'Repo Protocol v1', pages: [] }),
      });
    });

    it('restores the previous entry when the update fails validation', async () => {
      protocolServiceSpy.load.and.resolveTo(false);

      await component.update();

      expect(component.disk.availableProtocolsMeta['repo']).toEqual(previousMeta);
      expect(notificationsSpy.alert.calls.allArgs().some(args => args[0].title === 'Success')).toBeFalse();
    });

    it('keeps the updated entry when the update passes validation', async () => {
      protocolServiceSpy.load.and.resolveTo(true);

      await component.update();

      expect(component.disk.availableProtocolsMeta['repo'].gitlabConfig?.tag).toBe('v1');
      expect(notificationsSpy.alert.calls.allArgs().some(args => args[0].title === 'Success')).toBeTrue();
    });
  });
});
