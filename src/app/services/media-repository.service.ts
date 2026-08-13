import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';

import { GitlabConfigInterface } from '../models/disk/disk.interface';
import { DiskModel } from '../models/disk/disk.service';
import { MediaReposInterface, MediaRepoTarget, MediaRepoProtocolTarget } from '../interfaces/media-repos.interface';
import { GitlabService } from './gitlab.service';
import { Notifications } from './notifications.service';
import { Logger } from './logger.service';
import { Tasks } from './tasks.service';
import { DialogType, MediaUpdateStatus } from '../utilities/constants';
import { getDateString } from '../utilities/results-helper-functions';
import { GitlabReferenceDialog } from '../views/gitlab-reference-dialog/gitlab-reference-dialog.component';
import { MediaConflictDialog } from '../views/media-conflict-dialog/media-conflict-dialog.component';

@Injectable({
  providedIn: 'root',
})
export class MediaRepositoryService {
  private readonly diskModel = inject(DiskModel);
  private readonly gitlabService = inject(GitlabService);
  private readonly notifications = inject(Notifications);
  private readonly logger = inject(Logger);
  private readonly dialog = inject(MatDialog);
  private readonly tasks = inject(Tasks);

  /**
   * Download or refresh a media repository from Gitlab and store it in disk.mediaRepos.
   * A repository name is only unique per target, so the same repository can be downloaded
   * separately for the protocol and for one or more device types without conflicting.
   * Repos targeted at 'Protocol' are saved externally, the same way protocols themselves are downloaded.
   * @param config The configuration used to download the repository.
   * @param tagsOnly Whether only tags should be used or only commits.
   * @param target The target this media repository belongs to.
   * @returns The stored media repository entry.
   */
  async resolveAndDownload(config: GitlabConfigInterface, tagsOnly: boolean, target: MediaRepoTarget): Promise<MediaReposInterface> {
    const disk = this.diskModel.getDisk();
    const saveExternal = target === MediaRepoProtocolTarget;

    const safeFolder = `${config.group}${config.repository}${target}`.replace(/[^a-z0-9]/gi, '-').toLowerCase();
    const relativePath = `gitlab/${safeFolder}`;
    const taggedConfig = structuredClone(config);
    taggedConfig.tag = config.tag ? config.tag : await this.gitlabService.getLatestReference(config, tagsOnly);
    const directoryUri = await this.gitlabService.downloadGitlabRepository(taggedConfig, relativePath, saveExternal, tagsOnly);
    if (directoryUri === undefined) {
      throw new Error(`Failed to download media repository "${config.repository}".`);
    }

    const mediaRepo: MediaReposInterface = {
      ...taggedConfig,
      date: getDateString(),
      path: directoryUri,
      target,
    };
    const filteredRepos = disk.mediaRepos.filter(media => !(media.repository === mediaRepo.repository && media.target === mediaRepo.target));
    this.diskModel.updateDiskModel({ mediaRepos: [...filteredRepos, mediaRepo] });
    return mediaRepo;
  }

  /**
   * Prompt the user for a Gitlab reference type, then download the latest reference for a media repository if one is available.
   * @param gitlabConfig Config used for the repository.
   * @param target The target this media repository belongs to.
   * @param throwErrors Whether a download failure should propagate to the caller or be logged and surfaced as a non-blocking warning instead.
   * @returns The outcome of the update.
   */
  async promptAndUpdate(gitlabConfig: GitlabConfigInterface, target: MediaRepoTarget, throwErrors: boolean): Promise<MediaUpdateStatus> {
    const dialogRef = this.dialog.open(
      GitlabReferenceDialog,
      gitlabConfig ? { data: { title: 'Select GitLab Reference for Common Media' } } : undefined
    );
    const response = await firstValueFrom(dialogRef.afterClosed());
    if (!response) {
      return MediaUpdateStatus.Skipped;
    }
    const tagsOnly = response === GitlabReferenceDialog.OPTION_TAG;

    try {
      const latestReference = await this.gitlabService.getLatestReference(gitlabConfig, tagsOnly);
      if (gitlabConfig.tag === latestReference) {
        return MediaUpdateStatus.UpToDate;
      }
      await this.resolveAndDownload({ ...gitlabConfig, tag: latestReference }, tagsOnly, target);
      return MediaUpdateStatus.Updated;
    } catch (error) {
      this.logger.error(`Failed to update media repository "${gitlabConfig.repository}"`, error);
      if (throwErrors) {
        throw error;
      }
      return MediaUpdateStatus.Failed;
    }
  }

  /**
   * Delete the local copy of a media repository.
   * @param repository The identifier for the media repository.
   * @param target The target this media repository belongs to.
   */
  deleteRepository(repository: string, target: MediaRepoTarget): void {
    const disk = this.diskModel.getDisk();
    const mediaRepos = disk.mediaRepos.filter(media => !(media.repository === repository && media.target === target));
    this.diskModel.updateDiskModel({ mediaRepos: mediaRepos });
  }

  /**
   * Create a notification based on the media status.
   * @param status The media status for the notification.
   * @returns A promise that resolves once the user has dismissed the notification, if one was shown.
   */
  async notifyStatus(status: MediaUpdateStatus): Promise<void> {
    switch (status) {
      case MediaUpdateStatus.Skipped: {
        // NOOP skipped by user
        break;
      }
      case MediaUpdateStatus.UpToDate: {
        await firstValueFrom(
          this.notifications.alert({
            title: 'Up-to-date',
            content: 'Your media repository is already up-to-date.',
            type: DialogType.Confirm,
          })
        );
        break;
      }
      case MediaUpdateStatus.Failed: {
        await firstValueFrom(
          this.notifications.alert({
            title: 'Media Warning',
            content: `Could not update media repository. See logs for more information.`,
            type: DialogType.Alert,
          })
        );
        break;
      }
      case MediaUpdateStatus.Updated: {
        await firstValueFrom(
          this.notifications.alert({
            title: 'Media Updated',
            content: `Media repository successfully updated.`,
            type: DialogType.Alert,
          })
        );
        break;
      }
      default: {
        status satisfies never;
        break;
      }
    }
  }

  /**
   * Handle the download/update logic for a common media repository.
   * Failures are logged and surfaced as a non-blocking warning.
   * @param gitlabConfig The protocol's own Gitlab configuration (host/group/token are reused).
   * @param commonMediaRepository The name of the common media repository declared by the protocol.
   * @returns The outcome of the update.
   */
  async processCommonMedia(gitlabConfig: GitlabConfigInterface, commonMediaRepository: string | undefined): Promise<MediaUpdateStatus> {
    if (!commonMediaRepository) {
      return MediaUpdateStatus.Skipped;
    }
    try {
      this.tasks.register('Add Common Media', 'Downloading Media Files');
      const disk = this.diskModel.getDisk();
      const existing = disk.mediaRepos.find(media => media.repository === commonMediaRepository && media.target === MediaRepoProtocolTarget);

      if (existing) {
        // De-conflict existing media with what the user wants to download.
        const conflictRef = this.dialog.open(MediaConflictDialog, { data: { repository: commonMediaRepository } });
        const conflictResult = await firstValueFrom(conflictRef.afterClosed());
        if (conflictResult !== MediaConflictDialog.OPTION_OVERRIDE) {
          return MediaUpdateStatus.Skipped;
        }
      }

      const dialogRef = this.dialog.open(GitlabReferenceDialog, {
        data: { title: 'Select GitLab Reference for Common Media' },
      });
      const response = await firstValueFrom(dialogRef.afterClosed());
      if (!response) {
        return MediaUpdateStatus.Skipped;
      }
      const tagsOnly = response === GitlabReferenceDialog.OPTION_TAG;

      // Check if it is already up to date before downloading
      if (existing) {
        const latestReference = await this.gitlabService.getLatestReference(existing, tagsOnly);
        if (gitlabConfig.tag === latestReference) {
          return MediaUpdateStatus.UpToDate;
        }
      }

      const mediaConfig: GitlabConfigInterface = { ...gitlabConfig, repository: commonMediaRepository, tag: '' };
      await this.resolveAndDownload(mediaConfig, tagsOnly, MediaRepoProtocolTarget);
      return MediaUpdateStatus.Updated;
    } catch (error) {
      this.logger.error(`Failed to download/update common media repository "${commonMediaRepository}"`, error);
      return MediaUpdateStatus.Failed;
    } finally {
      this.tasks.deregister('Add Common Media');
    }
  }
}
