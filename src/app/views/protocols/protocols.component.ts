import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import { firstValueFrom, Subscription } from 'rxjs';
import _ from 'lodash';
import { DialogDataInterface } from '../../interfaces/dialog-data.interface';
import { ProtocolSchemaInterface } from '../../interfaces/protocol-schema.interface';
import { StateInterface } from '../../models/state/state.interface';
import { ProtocolInterface, ProtocolMetaInterface, ProtocolModelInterface } from '../../models/protocol/protocol.interface';
import { DiskInterface, GitlabConfigInterface } from '../../models/disk/disk.interface';
import { DiskModel } from '../../models/disk/disk.service';
import { ProtocolModel } from '../../models/protocol/protocol-model.service';
import { StateModel } from '../../models/state/state.service';
import { ProtocolService } from '../../controllers/protocol.service';
import { ExamService } from '../../controllers/exam.service';
import { Logger } from '../../services/logger.service';
import { Notifications } from '../../services/notifications.service';
import { Tasks } from '../../services/tasks.service';
import { FileService } from '../../services/file.service';
import { DialogType, ProtocolServer } from '../../utilities/constants';
import { getProtocolMetaData } from '../../utilities/protocol-helper-functions';
import { partialMetaDefaults } from '../../utilities/defaults';
import { GitlabService } from '../../services/gitlab.service';
import { MatDialog } from '@angular/material/dialog';
import { GitlabReferenceDialog } from '../gitlab-reference-dialog/gitlab-reference-dialog.component';

@Component({
  selector: 'app-protocols-view',
  templateUrl: './protocols.component.html',
  styleUrl: './protocols.component.css',
})
export class ProtocolsComponent implements OnInit, OnDestroy {
  private readonly diskModel = inject(DiskModel);
  private readonly examService = inject(ExamService);
  private readonly protocolM = inject(ProtocolModel);
  private readonly protocolService = inject(ProtocolService);
  private readonly fileService = inject(FileService);
  private readonly gitlabService = inject(GitlabService);
  private readonly logger = inject(Logger);
  private readonly notifications = inject(Notifications);
  private readonly stateModel = inject(StateModel);
  private readonly tasks = inject(Tasks);
  private readonly transloco = inject(TranslocoService);
  private readonly dialog = inject(MatDialog);

  selected?: ProtocolMetaInterface;
  disk: DiskInterface;
  diskSubscription: Subscription | undefined;
  stateSubscription: Subscription | undefined;
  protocolModel: ProtocolModelInterface;
  state: StateInterface;
  selectedSource = 'device';

  constructor() {
    this.disk = this.diskModel.getDisk();
    this.protocolModel = this.protocolM.getProtocolModel();
    this.state = this.stateModel.getState();
  }

  ngOnInit(): void {
    this.diskSubscription = this.diskModel.diskSubject.subscribe((updatedDisk: DiskInterface) => {
      this.disk = updatedDisk;
    });
    this.stateSubscription = this.stateModel.stateSubject.subscribe(updatedState => {
      this.state = updatedState;
    });
    // sort protocols by name here
  }

  ngOnDestroy(): void {
    this.diskSubscription?.unsubscribe();
    this.stateSubscription?.unsubscribe();
  }

  setSource(source: string) {
    this.selectedSource = source;
  }

  getAvailableProtocols(): { key: string; value: ProtocolMetaInterface }[] {
    const availableProtocols = this.disk.availableProtocolsMeta;
    return Object.entries(availableProtocols).map(([key, value]) => ({ key, value }));
  }

  trackByIndex(index: number, item: any): number {
    return index;
  }

  /**
   * Keep track of the selected protocol in the protocols table
   * @param p: meta data of the protocol to select
   */
  select(p: ProtocolMetaInterface): void {
    this.selected = p;
  }

  /**
   * Style protocol table rows based on which protocol is active and which is selected.
   * @param p: meta data of the protocol to select
   * @returns style class:  string
   */
  pclass(p: ProtocolMetaInterface): string {
    if (this.isActive(p)) {
      return 'active-row';
    } else if (this.selected === null || this.selected === undefined) {
      return '';
    } else if (_.isEqual(this.selected.name, p.name)) {
      return 'table-selected';
    } else {
      return '';
    }
  }

  /**
   * Add local protocols
   * @summary Launch file chooser, extract meta data from selected protocol folder,
   * save it to disk model, then retrieve protocol model to refresh the view.
   * @models dik, protocol
   */
  async addProtocols() {
    try {
      this.tasks.register('Add Local Protocol', 'Add Local Protocol');
      const result = await this.fileService.launchFileChooser();
      if (!result) {
        this.logger.error('There was an error in choosing the folder');
      }
      const protocolsFolderUri = result?.uri;
      const protocolName = result?.name;
      const resultFromListFiles = await this.fileService.listDirectory(protocolsFolderUri);
      if (!resultFromListFiles) {
        throw new Error('Unable to load protocol directory.');
      } else {
        const fileList = resultFromListFiles?.files;
        for (const file of fileList) {
          if (file.name == 'protocol.json') {
            const protocolContent: ProtocolSchemaInterface = JSON.parse(file.content);
            const protocol: ProtocolInterface = {
              ...partialMetaDefaults,
              name: protocolName!,
              contentURI: protocolsFolderUri!,
              server: ProtocolServer.LocalServer,
              admin: false,
              ...protocolContent,
            };
            await this.updateDiskModel(protocol);
          }
        }
      }
    } catch (error: any) {
      this.logger.error('Error when adding protocol:' + JSON.stringify(error));
      this.notifications
        .alert({
          title: 'Alert',
          content: 'Error Loading Protocol: Unable to properly load the protocol file, see logs for more information.',
          type: DialogType.Alert,
        })
        .subscribe();
    } finally {
      this.tasks.deregister('Add Local Protocol');
    }
  }

  /**
   * Fetch the remote repository and save it to the devices local storage.
   * @param config The configuration used to download the repository.
   * @param tagsOnly Whether only tags should be used or only commits.
   */
  async fetchGitlabProtocol(config: GitlabConfigInterface, useTagsOnly: boolean) {
    try {
      const localDir = `.tabsint-protocols/${config.repository}`;
      this.tasks.register('Add Gitlab Protocol', 'Download protocol files');
      const ref = config.tag ? config.tag : await this.gitlabService.getLatestReference(config, useTagsOnly);
      const folderUri = await this.gitlabService.downloadGitlabRepository(config, localDir, true, useTagsOnly);
      let protocolContent = undefined;
      try {
        const fileResponse = await this.fileService.readFile('protocol.json', folderUri);
        protocolContent = fileResponse?.content ? JSON.parse(fileResponse.content) : undefined;
      } catch {
        throw new Error('protocol.json not found in repository.');
      }

      const protocol = {
        ...partialMetaDefaults,
        version: ref,
        name: config.repository,
        server: ProtocolServer.Gitlab,
        contentURI: folderUri,
        admin: false,
        gitlabConfig: { ...config, tag: ref },
        ...protocolContent,
      };

      const isProtocolAdded = await this.updateDiskModel(protocol);

      if (isProtocolAdded) {
        this.notifications.alert({
          title: 'Success',
          content: `Protocol '${protocol.name}' imported successfully from GitLab.`,
          type: DialogType.Confirm,
        });
      }
    } catch (error: any) {
      this.handleGitlabError(error);
    } finally {
      this.tasks.deregister('Add Gitlab Protocol');
    }
  }

  /**
   * Handle error messages from Gitlab with a user notification.
   * @param error The error to be displayed.
   */
  handleGitlabError(error: unknown) {
    const err = error instanceof Error ? error.message : error;
    const errorMessage = String(err) || 'An error occurred while fetching the GitLab protocol.';

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

  isProtocolActive(): boolean {
    return this.isActive(this.selected);
  }

  isButtonDisabled(): boolean {
    return !this.selected;
  }

  showUpdateButton(): boolean {
    if (!this.selected) {
      return false;
    }
    return this.selected.server === ProtocolServer.Gitlab;
  }

  showDeleteButton(): boolean {
    if (!this.selected) {
      return false;
    }
    return this.selected.server !== ProtocolServer.Developer;
  }

  /**
   * Load selected protocol: make it the active protocol.
   * @summary Get the meta data of the selected protocol, then load all protocol files onto the protocolModel.activeProtocol object.
   * @models protocol
   * @param parameter: description
   */
  async loadProtocol() {
    if (!this.selected) {
      return;
    }

    this.tasks.register('Load Protocol', 'Loading Protocol...');

    try {
      const protocolMetaData = getProtocolMetaData(this.selected);

      if (!this.protocolModel.activeProtocol) {
        await this.protocolService.load(protocolMetaData, true);
      } else {
        const msg: DialogDataInterface = {
          title: 'Confirm',
          content: `Switch to protocol ${this.selected.name} and reset the current test? The current test results will be deleted`,
          type: DialogType.Confirm,
        };
        if (this.isActive(this.selected)) {
          msg.content = `Overwrite protocol ${this.selected.name} and reset the current test? The current test will be reset`;
        }

        this.notifications.alert(msg).subscribe(async result => {
          if (result === 'OK') {
            await this.protocolService.load(protocolMetaData, true);
            this.examService.reset();
          }
        });
      }
    } catch (e) {
      this.logger.debug('loadProtocol failed with error: ' + e);
    } finally {
      this.tasks.deregister('Load Protocol');
    }
  }

  /**
   * Delete protocol from protocols table
   * @summary Deactivate protocol if active, delete it from the disk model, un-select it.
   * @models models
   */
  delete(): void {
    if (!this.selected) {
      return;
    }

    if (this.isActive(this.selected)) {
      this.protocolModel.activeProtocol = undefined;
    }

    this.protocolService.delete(this.selected);
    this.selected = undefined;
    // notifications.alert(
    //     "Delete protocol ") +
    //     this.selected.name +
    //     " and remove protocol files from disk?"),
    //     (buttonIndex) => {
    //         if (buttonIndex === 1) {
    //             protocol.delete(this.selected);
    //             this.selected = undefined;
    //         }
    //     }
    // );
  }

  async update(): Promise<void> {
    if (!this.selected || this.selected.server !== ProtocolServer.Gitlab) {
      this.notifications.alert({
        title: 'Error',
        content: 'Selected protocol was not imported from GitLab.',
        type: DialogType.Alert,
      });
      return;
    }

    // Determine which Gitlab reference type the user wants
    const dialogRef = this.dialog.open(GitlabReferenceDialog);
    const response = await firstValueFrom(dialogRef.afterClosed());
    if (!response) {
      // User cancelled the update do not continue
      return;
    }
    const useTagsOnly = response === GitlabReferenceDialog.OPTION_TAG;

    try {
      this.tasks.register('Update Protocol', `Checking for updates for ${this.selected.name}...`);

      const selectedGitlabConfig = this.selected.gitlabConfig;
      if (!selectedGitlabConfig) {
        throw new Error('GitLab configuration is missing for the selected protocol.');
      }
      this.logger.debug('Printing selected protocols gitlab configuration');
      this.logger.debug(JSON.stringify(selectedGitlabConfig));
      if (!selectedGitlabConfig.host || !selectedGitlabConfig.token || !selectedGitlabConfig.group || !selectedGitlabConfig.repository) {
        throw new Error('Missing required GitLab configuration. Please specify a GitLab host, token, group, and repository.');
      }
      const latestReference = await this.gitlabService.getLatestReference(selectedGitlabConfig, useTagsOnly);
      this.logger.debug(`Latest reference: ${latestReference}`);

      if (selectedGitlabConfig.tag === latestReference) {
        this.notifications.alert({
          title: 'Up-to-date',
          content: 'Your protocol is already up-to-date.',
          type: DialogType.Confirm,
        });
        return;
      }
      const localDir = `.tabsint-protocols/${selectedGitlabConfig.repository}`;
      const newGitlabConfig = { ...selectedGitlabConfig, tag: latestReference };
      const localDirUri = await this.gitlabService.downloadGitlabRepository(newGitlabConfig, localDir, true, useTagsOnly);
      const fileResponse = await this.fileService.readFile('protocol.json', localDirUri);
      const protocolContent = fileResponse?.content ? JSON.parse(fileResponse.content) : undefined;
      const updatedProtocol: ProtocolInterface = {
        ...partialMetaDefaults,
        version: latestReference,
        name: selectedGitlabConfig.repository,
        server: ProtocolServer.Gitlab,
        contentURI: localDirUri,
        admin: false,
        gitlabConfig: newGitlabConfig,
        ...protocolContent,
      };

      const protocolUpdated = await this.updateDiskModel(updatedProtocol);

      if (protocolUpdated) {
        this.notifications.alert({
          title: 'Success',
          content: `Protocol '${this.selected?.name}' has been updated successfully.`,
          type: DialogType.Confirm,
        });
      }
    } catch (error: any) {
      this.handleGitlabError(error);
    } finally {
      this.tasks.deregister('Update Protocol');
    }
  }

  /**
   * Callback for gitlab configuration submission events.
   * @param config The new validated configuration.
   */
  async onGitlabConfigSubmit(config: GitlabConfigInterface) {
    if (config.tag) {
      // Tag already exists so we can immediately fetch
      this.disk.preferences.gitlabConfig = { ...this.disk.preferences.gitlabConfig, ...config };
      this.diskModel.storeDisk();
      await this.fetchGitlabProtocol(config, false);
    } else {
      // Determine which Gitlab reference type the user wants
      const dialogRef = this.dialog.open(GitlabReferenceDialog);
      dialogRef.afterClosed().subscribe(async result => {
        if (result) {
          const useTagsOnly = result === GitlabReferenceDialog.OPTION_TAG;
          this.disk.preferences.gitlabConfig = { ...this.disk.preferences.gitlabConfig, ...config };
          this.diskModel.storeDisk();
          await this.fetchGitlabProtocol(config, useTagsOnly);
        }
      });
    }
  }

  gitlabButtonClass(): string {
    return this.disk.preferences.server === ProtocolServer.Gitlab ? 'active' : 'disabled';
  }

  localServerButtonClass(): string {
    return this.disk.preferences.server === ProtocolServer.LocalServer ? 'active' : '';
  }

  /**
   * Checks whether a protocol is active.
   * @summary Checks if the input protocol is the same
   * as the one on the protocolModel.activeProtocol object.
   * @models protocol
   * @param p protocol to check whether it is active or not
   * @returns whether protocol is active: boolean
   */
  private isActive(p: ProtocolMetaInterface | undefined): boolean {
    return (
      (this.protocolModel.activeProtocol &&
        p &&
        this.protocolModel.activeProtocol.name == p.name &&
        this.protocolModel.activeProtocol.path == p.path) ||
      false
    );
  }

  private async updateDiskModel(protocol: ProtocolInterface): Promise<boolean> {
    const protocolMetaData: ProtocolMetaInterface = getProtocolMetaData(protocol);
    const availableMetaProtocols = this.disk.availableProtocolsMeta;

    // Check if a protocol with this name already exists
    const existingProtocolEntry = Object.entries(availableMetaProtocols).find(([key, p]) => p.name === protocolMetaData.name);

    if (existingProtocolEntry) {
      const [, existingProtocol] = existingProtocolEntry;

      // Never overwrite Developer protocols
      if (existingProtocol.server === ProtocolServer.Developer) {
        this.notifications
          .alert({
            title: 'Cannot Overwrite Developer Protocol',
            content: `Cannot add protocol "${protocolMetaData.name}" because a Developer protocol with the same name already exists. Developer protocols cannot be overwritten.`,
            type: DialogType.Alert,
          })
          .subscribe();
        return false; // Don't add it
      }
    }
    availableMetaProtocols[protocolMetaData.name] = protocolMetaData;
    this.diskModel.updateDiskModel({ availableProtocolsMeta: availableMetaProtocols });
    this.protocolModel = this.protocolM.getProtocolModel();
    this.select(protocolMetaData);
    await this.loadProtocol();
    return true;
  }

  toggleValidateProtocols() {
    this.diskModel.updatePreferences({ validateProtocols: !this.disk.preferences.validateProtocols });
  }

  get validateProtocolPopover() {
    return this.transloco.translate('Validate Protocol Popover');
  }
  get protocolServerPopover() {
    return this.transloco.translate('Protocol Server Popover');
  }
  get protocolTablePopover() {
    return this.transloco.translate('Protocol Table Popover');
  }
  get mediaTablePopover() {
    return this.transloco.translate('Media Table Popover');
  }
  get mediaAddPopover() {
    return this.transloco.translate('Media Add Popover');
  }
  get serverDefaultPopover() {
    return this.transloco.translate('Server Default Popover');
  }
  get gitlabAddPopover() {
    return this.transloco.translate('Gitlab Add Popover');
  }
  get gitlabAddVersionPopover() {
    return this.transloco.translate('Gitlab Add Version Popover');
  }
  get gitlabHostPopover() {
    return this.transloco.translate('Hostname of the gitlab server instance you are running. Generally this will be "https://gitlab.com/"');
  }
  get gitlabTokenPopover() {
    return this.transloco.translate('Gitlab Token Popover');
  }
  get gitlabNamespacePopover() {
    return this.transloco.translate('The group where protocol, media, and result repositories are stored.');
  }
  get gitlabUseTagsPopover() {
    return this.transloco.translate('Gitlab Use Tags Popover');
  }
  get gitlabUseSeparateResultsRepoPopover() {
    return this.transloco.translate('Gitlab Separate Results Repo Popover');
  }
  get gitlabResultsGroupPopover() {
    return this.transloco.translate('Gitlab Results Group Popover');
  }
  get gitlabResultsRepoPopover() {
    return this.transloco.translate('Gitlab Results Repo Popover');
  }
  get downloadCreareProtocolsPopover() {
    return this.transloco.translate('Download Creare Protocols Popover');
  }
  get localAddPopover() {
    return this.transloco.translate('Local Add Popover');
  }
}
