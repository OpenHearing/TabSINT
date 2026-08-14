import { TestBed } from '@angular/core/testing';
import { of, Subject } from 'rxjs';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';

import { MediaRepositoryService } from './media-repository.service';
import { DiskModel } from '../models/disk/disk.service';
import { GitlabConfigInterface } from '../models/disk/disk.interface';
import { GitlabService } from './gitlab.service';
import { Notifications } from './notifications.service';
import { Logger } from './logger.service';
import { Tasks } from './tasks.service';
import { GitlabReferenceDialog } from '../views/gitlab-reference-dialog/gitlab-reference-dialog.component';
import { MediaConflictDialog } from '../views/media-conflict-dialog/media-conflict-dialog.component';
import { MediaRepoProtocolTarget } from '../interfaces/media-repos.interface';
import { DeviceType, MediaUpdateStatus } from '../utilities/constants';

describe('MediaRepositoryService', () => {
  let service: MediaRepositoryService;
  let diskModel: DiskModel;
  let gitlabServiceSpy: jasmine.SpyObj<GitlabService>;
  let dialogSpy: jasmine.SpyObj<MatDialog>;
  let notificationsSpy: jasmine.SpyObj<Notifications>;
  let loggerSpy: jasmine.SpyObj<Logger>;

  const config: GitlabConfigInterface = {
    host: 'https://gitlab.com/',
    group: 'group',
    repository: 'repo',
    token: 'token',
    tag: '',
  };

  function dialogRefReturning(result: unknown): MatDialogRef<unknown> {
    return { afterClosed: () => of(result) } as MatDialogRef<unknown>;
  }

  beforeEach(() => {
    gitlabServiceSpy = jasmine.createSpyObj('GitlabService', ['getLatestReference', 'downloadGitlabRepository']);
    gitlabServiceSpy.getLatestReference.and.resolveTo('abc123');
    gitlabServiceSpy.downloadGitlabRepository.and.resolveTo('uri://downloaded');

    dialogSpy = jasmine.createSpyObj('MatDialog', ['open']);
    dialogSpy.open.and.returnValue(dialogRefReturning(GitlabReferenceDialog.OPTION_TAG));

    notificationsSpy = jasmine.createSpyObj('Notifications', ['alert']);
    notificationsSpy.alert.and.returnValue(of('closed'));
    loggerSpy = jasmine.createSpyObj('Logger', ['debug', 'warning', 'error']);

    TestBed.configureTestingModule({
      providers: [
        DiskModel,
        { provide: GitlabService, useValue: gitlabServiceSpy },
        { provide: MatDialog, useValue: dialogSpy },
        { provide: Notifications, useValue: notificationsSpy },
        { provide: Logger, useValue: loggerSpy },
        { provide: Tasks, useValue: jasmine.createSpyObj('Tasks', ['register', 'deregister']) },
      ],
    });

    service = TestBed.inject(MediaRepositoryService);
    diskModel = TestBed.inject(DiskModel);
  });

  describe('resolveAndDownload', () => {
    it('downloads and stores a new entry targeted at the given target', async () => {
      const result = await service.resolveAndDownload(config, false, DeviceType.Wahts);

      expect(result.target).toBe(DeviceType.Wahts);
      expect(result.path).toBe('uri://downloaded');
      expect(diskModel.getDisk().mediaRepos).toEqual([result]);
    });

    it('keeps a Protocol-targeted entry and a device-targeted entry of the same repository separate', async () => {
      await service.resolveAndDownload(config, false, MediaRepoProtocolTarget);
      await service.resolveAndDownload(config, false, DeviceType.Wahts);

      const repos = diskModel.getDisk().mediaRepos.filter(repo => repo.repository === config.repository);
      expect(repos.length).toBe(2);
      expect(repos.find(repo => repo.target === MediaRepoProtocolTarget)).toBeDefined();
      expect(repos.find(repo => repo.target === DeviceType.Wahts)).toBeDefined();
    });

    it('downloads two device targets of the same repository to different on-disk paths', async () => {
      gitlabServiceSpy.downloadGitlabRepository.and.callFake((_downloadConfig, relativePath) => Promise.resolve(relativePath));

      const wahts = await service.resolveAndDownload(config, false, DeviceType.Wahts);
      const tympan = await service.resolveAndDownload(config, false, DeviceType.Tympan);

      expect(wahts.path).not.toBe(tympan.path);
    });

    it('replaces the existing entry for the same repository and target', async () => {
      await service.resolveAndDownload(config, false, DeviceType.Wahts);
      gitlabServiceSpy.getLatestReference.and.resolveTo('def456');
      await service.resolveAndDownload({ ...config, tag: '' }, false, DeviceType.Wahts);

      const repos = diskModel.getDisk().mediaRepos.filter(repo => repo.repository === config.repository && repo.target === DeviceType.Wahts);
      expect(repos.length).toBe(1);
      expect(repos[0].tag).toBe('def456');
    });

    it('throws if the download fails', async () => {
      gitlabServiceSpy.downloadGitlabRepository.and.resolveTo(undefined);

      await expectAsync(service.resolveAndDownload(config, false, DeviceType.Wahts)).toBeRejected();
    });
  });

  describe('promptAndUpdate', () => {
    it('skips without downloading when the user cancels the reference dialog', async () => {
      const mediaRepo = await service.resolveAndDownload(config, false, DeviceType.Wahts);
      dialogSpy.open.and.returnValue(dialogRefReturning(null));
      gitlabServiceSpy.downloadGitlabRepository.calls.reset();

      const status = await service.promptAndUpdate(mediaRepo, DeviceType.Wahts, false);

      expect(status).toBe(MediaUpdateStatus.Skipped);
      expect(gitlabServiceSpy.downloadGitlabRepository).not.toHaveBeenCalled();
    });

    it('reports up-to-date and does not redownload when the latest reference is unchanged', async () => {
      const mediaRepo = await service.resolveAndDownload(config, false, DeviceType.Wahts);
      gitlabServiceSpy.downloadGitlabRepository.calls.reset();

      const status = await service.promptAndUpdate(mediaRepo, DeviceType.Wahts, false);

      expect(status).toBe(MediaUpdateStatus.UpToDate);
      expect(gitlabServiceSpy.downloadGitlabRepository).not.toHaveBeenCalled();
    });

    it('downloads the latest reference, updates the disk model, and reports updated when it has changed', async () => {
      const mediaRepo = await service.resolveAndDownload(config, false, DeviceType.Wahts);
      gitlabServiceSpy.getLatestReference.and.resolveTo('def456');

      const status = await service.promptAndUpdate(mediaRepo, DeviceType.Wahts, false);

      expect(status).toBe(MediaUpdateStatus.Updated);
      const repos = diskModel.getDisk().mediaRepos.filter(repo => repo.repository === config.repository && repo.target === DeviceType.Wahts);
      expect(repos[0].tag).toBe('def456');
    });

    it('only updates the entry matching the given target, leaving other targets untouched', async () => {
      await service.resolveAndDownload(config, false, MediaRepoProtocolTarget);
      const wahtsRepo = await service.resolveAndDownload(config, false, DeviceType.Wahts);
      gitlabServiceSpy.getLatestReference.and.resolveTo('def456');

      await service.promptAndUpdate(wahtsRepo, DeviceType.Wahts, false);

      const repos = diskModel.getDisk().mediaRepos.filter(repo => repo.repository === config.repository);
      const protocolRepo = repos.find(repo => repo.target === MediaRepoProtocolTarget);
      const updatedWahtsRepo = repos.find(repo => repo.target === DeviceType.Wahts);
      expect(protocolRepo?.tag).toBe('abc123');
      expect(updatedWahtsRepo?.tag).toBe('def456');
    });

    it('downloads for the first time using the provided gitlabConfig when there is no existing entry', async () => {
      const status = await service.promptAndUpdate(config, DeviceType.Wahts, false);

      expect(status).toBe(MediaUpdateStatus.Updated);
      const repos = diskModel.getDisk().mediaRepos.filter(repo => repo.repository === config.repository);
      expect(repos.length).toBe(1);
      expect(repos[0].target).toBe(DeviceType.Wahts);
    });

    it('does not resolve until the redownload has actually finished', async () => {
      const mediaRepo = await service.resolveAndDownload(config, false, DeviceType.Wahts);
      gitlabServiceSpy.getLatestReference.and.resolveTo('def456');
      let resolveDownload!: (uri: string) => void;
      gitlabServiceSpy.downloadGitlabRepository.and.returnValue(new Promise(resolve => (resolveDownload = resolve)));

      let settled = false;
      const promptPromise = service.promptAndUpdate(mediaRepo, DeviceType.Wahts, false).then(status => {
        settled = true;
        return status;
      });

      // Flush the microtask queue via a macrotask boundary so every step that *can* resolve on its own
      // (dialog selection, latest-reference lookup) has already run; only the pending download remains.
      await new Promise(resolve => setTimeout(resolve, 0));
      expect(settled).toBeFalse();
      const reposBeforeDownloadFinishes = diskModel.getDisk().mediaRepos.filter(repo => repo.repository === config.repository);
      expect(reposBeforeDownloadFinishes[0].tag).toBe('abc123');

      resolveDownload('uri://downloaded-2');
      const status = await promptPromise;

      expect(settled).toBeTrue();
      expect(status).toBe(MediaUpdateStatus.Updated);
      const reposAfterDownloadFinishes = diskModel.getDisk().mediaRepos.filter(repo => repo.repository === config.repository);
      expect(reposAfterDownloadFinishes[0].tag).toBe('def456');
    });

    it('propagates the error when throwErrors is true', async () => {
      const mediaRepo = await service.resolveAndDownload(config, false, DeviceType.Wahts);
      gitlabServiceSpy.getLatestReference.and.resolveTo('def456');
      gitlabServiceSpy.downloadGitlabRepository.and.resolveTo(undefined);

      await expectAsync(service.promptAndUpdate(mediaRepo, DeviceType.Wahts, true)).toBeRejected();
      expect(loggerSpy.error).toHaveBeenCalled();
    });

    it('logs and returns Failed instead of throwing when throwErrors is false', async () => {
      const mediaRepo = await service.resolveAndDownload(config, false, DeviceType.Wahts);
      gitlabServiceSpy.getLatestReference.and.resolveTo('def456');
      gitlabServiceSpy.downloadGitlabRepository.and.resolveTo(undefined);

      const status = await service.promptAndUpdate(mediaRepo, DeviceType.Wahts, false);

      expect(status).toBe(MediaUpdateStatus.Failed);
      expect(loggerSpy.error).toHaveBeenCalled();
    });
  });

  describe('deleteRepository', () => {
    it('deletes only the entry matching the given repository and target', async () => {
      await service.resolveAndDownload(config, false, MediaRepoProtocolTarget);
      await service.resolveAndDownload(config, false, DeviceType.Wahts);

      service.deleteRepository(config.repository, DeviceType.Wahts);

      const repos = diskModel.getDisk().mediaRepos.filter(repo => repo.repository === config.repository);
      expect(repos.length).toBe(1);
      expect(repos[0].target).toBe(MediaRepoProtocolTarget);
    });
  });

  describe('notifyStatus', () => {
    it('resolves immediately without alerting when the status is Skipped', async () => {
      await service.notifyStatus(MediaUpdateStatus.Skipped);

      expect(notificationsSpy.alert).not.toHaveBeenCalled();
    });

    it('does not resolve until the user has dismissed the alert', async () => {
      const alertClosed = new Subject<string>();
      notificationsSpy.alert.and.returnValue(alertClosed.asObservable());

      let settled = false;
      const notifyPromise = service.notifyStatus(MediaUpdateStatus.Updated).then(() => {
        settled = true;
      });

      await new Promise(resolve => setTimeout(resolve, 0));
      expect(settled).toBeFalse();

      alertClosed.next('closed');
      alertClosed.complete();
      await notifyPromise;

      expect(settled).toBeTrue();
    });

    it('alerts for UpToDate, Failed, and Updated statuses', async () => {
      await service.notifyStatus(MediaUpdateStatus.UpToDate);
      await service.notifyStatus(MediaUpdateStatus.Failed);
      await service.notifyStatus(MediaUpdateStatus.Updated);

      expect(notificationsSpy.alert).toHaveBeenCalledTimes(3);
    });
  });

  describe('processCommonMedia', () => {
    it('does nothing when no common media repository is specified', async () => {
      await service.processCommonMedia(config, undefined);

      expect(dialogSpy.open).not.toHaveBeenCalled();
      expect(diskModel.getDisk().mediaRepos.length).toBe(0);
    });

    it('downloads directly, without a conflict prompt, when a device already owns a copy but the protocol does not', async () => {
      await service.resolveAndDownload(config, false, DeviceType.Wahts);
      dialogSpy.open.calls.reset();
      dialogSpy.open.and.returnValue(dialogRefReturning(GitlabReferenceDialog.OPTION_TAG));

      await service.processCommonMedia(config, config.repository);

      expect(dialogSpy.open).toHaveBeenCalledTimes(1);
      expect(dialogSpy.open).not.toHaveBeenCalledWith(MediaConflictDialog, jasmine.anything());
      const repos = diskModel.getDisk().mediaRepos.filter(repo => repo.repository === config.repository);
      expect(repos.find(repo => repo.target === MediaRepoProtocolTarget)).toBeDefined();
      expect(repos.find(repo => repo.target === DeviceType.Wahts)).toBeDefined();
    });

    it('prompts to resolve a conflict when the protocol already owns a copy, and skips on dismissal', async () => {
      await service.resolveAndDownload(config, false, MediaRepoProtocolTarget);
      dialogSpy.open.and.returnValue(dialogRefReturning(null));

      await service.processCommonMedia(config, config.repository);

      expect(dialogSpy.open).toHaveBeenCalledWith(MediaConflictDialog, jasmine.anything());
      expect(gitlabServiceSpy.downloadGitlabRepository).toHaveBeenCalledTimes(1);
    });

    it('re-downloads when the user chooses to override an existing protocol copy', async () => {
      await service.resolveAndDownload(config, false, MediaRepoProtocolTarget);
      dialogSpy.open.and.returnValues(dialogRefReturning(MediaConflictDialog.OPTION_OVERRIDE), dialogRefReturning(GitlabReferenceDialog.OPTION_TAG));

      await service.processCommonMedia(config, config.repository);

      expect(gitlabServiceSpy.downloadGitlabRepository).toHaveBeenCalledTimes(2);
      const repos = diskModel.getDisk().mediaRepos.filter(repo => repo.repository === config.repository);
      expect(repos.length).toBe(1);
    });

    it('logs and returns Failed instead of throwing when the download fails', async () => {
      gitlabServiceSpy.downloadGitlabRepository.and.resolveTo(undefined);

      const status = await service.processCommonMedia(config, config.repository);

      expect(status).toBe(MediaUpdateStatus.Failed);
      expect(loggerSpy.error).toHaveBeenCalled();
    });
  });
});
