import { Component, Input, OnDestroy, OnInit, inject } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import { firstValueFrom, Subscription } from 'rxjs';

import { DiskInterface, GitlabConfigInterface } from '../../../../models/disk/disk.interface';

import { DiskModel } from '../../../../models/disk/disk.service';

import { DeviceState, DeviceType, DialogType } from '../../../../utilities/constants';
import { IDevice } from '../../../../interfaces/devices/device.interface';
import { DevicesService } from '../../../../services/devices/devices.service';
import { Notifications } from '../../../../services/notifications.service';
import { MediaReposInterface } from '../../../../interfaces/media-repos.interface';
import { GitlabService } from '../../../../services/gitlab.service';
import { getDateString } from '../../../../utilities/results-helper-functions';
import { Tasks } from '../../../../services/tasks.service';
import { Logger } from '../../../../services/logger.service';
import { isValidDeviceResponse } from '../../../../guards/type.guard';
import { DialogDataInterface } from '../../../../interfaces/dialog-data.interface';
import { MatDialog } from '@angular/material/dialog';
import { GitlabReferenceDialog } from '../../../gitlab-reference-dialog/gitlab-reference-dialog.component';

@Component({
  selector: 'app-media-management-view',
  templateUrl: './media-management.component.html',
  styleUrl: './media-management.component.css',
})
export class MediaManagementComponent implements OnInit, OnDestroy {
  private readonly diskModel = inject(DiskModel);
  private readonly transloco = inject(TranslocoService);
  private readonly devicesService = inject(DevicesService);
  private readonly notifications = inject(Notifications);
  private readonly gitlabService = inject(GitlabService);
  private readonly tasks = inject(Tasks);
  private readonly logger = inject(Logger);
  private readonly dialog = inject(MatDialog);

  @Input() device!: IDevice;
  DeviceState = DeviceState;
  disk: DiskInterface;
  enableMediaManagement: boolean = false;
  useRootDirectory: boolean = false;
  mediaRepos: MediaReposInterface[] = [];
  selectedMediaRepo: string | undefined = undefined;
  syncingMedia: boolean = false;
  gitlabConfig: Partial<GitlabConfigInterface> = {};
  diskSubscription: Subscription | undefined;
  Number = Number;

  constructor() {
    this.disk = this.diskModel.getDisk();
  }

  ngOnInit(): void {
    this.diskSubscription = this.diskModel.diskSubject.subscribe((updatedDisk: DiskInterface) => {
      this.disk = updatedDisk;
      this.mediaRepos = updatedDisk.mediaRepos;
    });
  }

  ngOnDestroy(): void {
    this.diskSubscription?.unsubscribe();
    this.cancelMediaSync();
  }

  /**
   * Cancel an ongoing media sync/transfer.
   */
  async cancelMediaSync() {
    this.logger.debug('Cancelling Media Repo Sync');
    this.tasks.register('cancelMediaSync', 'Cancelling CHA Media Sync.');
    try {
      await this.devicesService.cancelFileOperation(this.device);
    } catch (e) {
      this.logger.error('Error caught when cancelling file operation', e);
    } finally {
      this.tasks.deregister('cancelMediaSync');
      this.syncingMedia = false;
    }
  }

  /**
   * Sync/transfer a media repository to a device.
   * @param name The identifier for the media repository.
   */
  async syncRepositoryToDevice(name: string | undefined) {
    if (!name || this.syncingMedia) return;
    const mediaRepo = this.mediaRepos.find(repo => repo.repository === name);
    this.logger.debug('Starting Media Repo Sync');

    if (mediaRepo === undefined) {
      const missingRepoMsg = 'Cannot sync repository to device.  No repository selected.';
      this.logger.warning(missingRepoMsg);
      this.notifications.alert({
        title: 'Alert',
        content: missingRepoMsg,
        type: DialogType.Alert,
      });
      return;
    }

    this.tasks.register('mediaSync', 'Syncing Media Repository. This may take a few minutes...');

    let transferSuccess = false;
    this.syncingMedia = true;
    try {
      const remotePath = this.getRemoteMediaPath(this.device.type);
      if (remotePath !== undefined) {
        await this.devicesService.abortExams(this.device);
        const response = await this.devicesService.transferDirectory(this.device, mediaRepo.path, remotePath);
        transferSuccess = isValidDeviceResponse(response);
      } else {
        this.logger.error('Remote path not found for media transfer');
      }
    } catch (e) {
      this.logger.error('Error caught when transferring files', e);
    } finally {
      this.tasks.deregister('mediaSync');
      this.syncingMedia = false;
      const completionMsg = transferSuccess ? 'Media successfully transferred.' : 'Media transfer cancelled, see logs for additional details.';
      this.notifications.alert({
        title: 'Alert',
        content: completionMsg,
        type: DialogType.Alert,
      });
    }
  }

  /**
   * Update the local copy of a repository by fetching it from the server.
   * @param name The identifier for the media repository.
   */
  async updateLocalRepository(name: string | undefined) {
    if (!name) return;
    const mediaRepo = this.mediaRepos.find(media => media.repository === name);
    if (mediaRepo !== undefined) {
      // Determine which Gitlab reference type the user wants
      const dialogRef = this.dialog.open(GitlabReferenceDialog);
      const response = await firstValueFrom(dialogRef.afterClosed());
      if (!response) {
        // User cancelled the update do not continue
        return;
      }
      try {
        const useTagsOnly = response === GitlabReferenceDialog.OPTION_TAG;
        const latestReference = await this.gitlabService.getLatestReference(mediaRepo, useTagsOnly);
        this.logger.debug(`Latest reference: ${latestReference}`);
        if (mediaRepo.tag === latestReference) {
          this.notifications.alert({
            title: 'Up-to-date',
            content: 'Your media repository is already up-to-date.',
            type: DialogType.Confirm,
          });
          return;
        }
        const newGitlabConfig = { ...mediaRepo, tag: latestReference };
        await this.fetchRepository(newGitlabConfig, useTagsOnly);
      } catch (error) {
        this.handleGitlabError(error);
      }
    }
  }

  /**
   * Delete the local copy of a repository.
   * @param name The identifier for the media repository.
   */
  async deleteLocalRepository(name: string | undefined) {
    if (!name) return;
    if (this.selectedMediaRepo === name) {
      this.selectedMediaRepo = undefined;
    }
    const mediaRepos = this.mediaRepos.filter(media => media.repository !== name);
    this.diskModel.updateDiskModel({ mediaRepos: mediaRepos });
  }

  /**
   * Download a local copy of a repository by fetching it from the server.
   * @param config The configuration used to download the repository.
   */
  async addRemoteRepository(config: GitlabConfigInterface) {
    if (this.mediaRepos.filter(media => media.repository == config.repository).length > 0) {
      this.notifications.alert({
        title: 'Failure',
        content: 'Media repository already exists, update the existing reference.',
        type: DialogType.Confirm,
      });
      return;
    }
    if (config.tag) {
      // Tag already exists so we can immediately fetch
      await this.fetchRepository(config, false);
    } else {
      // Determine which Gitlab reference type the user wants
      const dialogRef = this.dialog.open(GitlabReferenceDialog);
      dialogRef.afterClosed().subscribe(async result => {
        if (result) {
          const useTagsOnly = result === GitlabReferenceDialog.OPTION_TAG;
          await this.fetchRepository(config, useTagsOnly);
        }
      });
    }
  }

  /**
   * Toggle the use root directory boolean and show a confirmation dialog before enabling.
   * @param event The click event.
   */
  async useRootDirectoryToggle(event: Event) {
    const checkbox = event.target as HTMLInputElement;
    if (this.useRootDirectory) {
      this.useRootDirectory = false;
    } else {
      const rootDirectoryMsg = this.transloco.translate(
        'Are you sure you want to enable syncing to the root directory? ' +
          'Syncing to the root directory could change the media used in all standard Creare CHA exams. ' +
          'Only sync this repo if you know what you are doing!'
      );
      const msg: DialogDataInterface = {
        title: 'Confirm Root Directory',
        content: rootDirectoryMsg,
        type: DialogType.Confirm,
      };
      const result = await firstValueFrom(this.notifications.alert(msg));
      if (result === 'OK') {
        this.useRootDirectory = true;
      }
    }
    checkbox.checked = this.useRootDirectory;
  }

  /**
   * Handle error messages from Gitlab with a user notification.
   * @param error The error to be displayed.
   */
  handleGitlabError(error: unknown) {
    const err = error instanceof Error ? error.message : error;
    const errorMessage = String(err) || 'An error occurred while fetching the GitLab media.';

    if (errorMessage.includes('Unauthorized')) {
      this.notifications.alert({
        title: 'Unauthorized',
        content: 'Check your GitLab credentials.',
        type: DialogType.Alert,
      });
    } else {
      this.notifications.alert({
        title: 'Error',
        content: errorMessage,
        type: DialogType.Alert,
      });
    }
  }

  /**
   * Fetch the remote repository and save it to the devices local storage.
   * @param config The configuration used to download the repository.
   * @param tagsOnly Whether only tags should be used or only commits.
   */
  private async fetchRepository(config: GitlabConfigInterface, tagsOnly: boolean) {
    const safeFolder = `${config.group}${config.repository}`.replace(/[^a-z0-9]/gi, '-').toLowerCase();
    const relativePath = `gitlab/${safeFolder}`;
    const taggedConfig = structuredClone(config);
    try {
      this.tasks.register('Add Gitlab Media', 'Downloading Media Files...');
      taggedConfig.tag = config.tag ? config.tag : await this.gitlabService.getLatestReference(config, tagsOnly);
      const directoryUri = await this.gitlabService.downloadGitlabRepository(taggedConfig, relativePath, false, tagsOnly);
      if (directoryUri !== undefined) {
        const mediaRepo: MediaReposInterface = { ...taggedConfig, date: getDateString(), path: directoryUri };
        const filteredRepos = this.mediaRepos.filter(media => media.repository !== mediaRepo.repository);
        this.diskModel.updateDiskModel({ mediaRepos: [...filteredRepos, mediaRepo] });
        this.selectedMediaRepo = config.repository;
        this.notifications.alert({
          title: 'Success',
          content: 'Media imported successfully from GitLab.',
          type: DialogType.Alert,
        });
      }
    } catch (error) {
      this.handleGitlabError(error);
    } finally {
      this.tasks.deregister('Add Gitlab Media');
    }
  }

  /**
   * Get the remote path where media should be added on a device.
   * @param deviceType The device type to determine path for.
   * @returns The remote path or undefined if not found.
   */
  getRemoteMediaPath(deviceType: DeviceType): string | undefined {
    let remotePath = undefined;
    switch (deviceType) {
      case DeviceType.Tympan:
        break;
      case DeviceType.Wahts:
        // Relative path from the root directory to do a root write
        remotePath = this.useRootDirectory ? '' : 'USER/';
        break;
      case DeviceType.Duodose:
        break;
      case DeviceType.Svantek:
        break;
      default:
        deviceType satisfies never;
        break;
    }
    return remotePath;
  }

  get headsetMediaTablePopover() {
    return this.transloco.translate(
      'Table of media repositories currently stored in TabSINT.  Select a repo to update, delete, or sync to the device. <b>NOTE</b> Transmitting media to the headset can take hours.  Make sure the headset and tablet are plugged in.'
    );
  }
  get headsetMediaDownloadPopover() {
    return this.transloco.translate(
      'TabSINT can update the media stored on the device.  Use this panel to download/update device media from Gitlab.\n\nSee the <b>Gitlab Configuration</b> pane under the <i>Configuration</i> tab to specify the Gitlab host, group and other repository parameters.'
    );
  }
  get gitlabAddMediaPopover() {
    return this.transloco.translate(
      'Type in the name of media repository located on the host in the group defined in the <b>Gitlab Configuration</b> pane under the <i>Configuration</i> tab.'
    );
  }
  get gitlabAddMediaVersionPopover() {
    return this.transloco.translate(
      '<strong>OPTIONAL:</strong> Type in the repository tag for the version of the repository you would like to download. Leave blank to download the latest tag/commit from the repository.'
    );
  }
  get useRootDirectoryPopover() {
    return this.transloco.translate('Whether the transfer should move the files to the root directory on the device or to the user directory.');
  }
}
