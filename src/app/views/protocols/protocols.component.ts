import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import { Subscription } from 'rxjs';
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
import { CapacitorHttp } from '@capacitor/core';

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
  private readonly logger = inject(Logger);
  private readonly notifications = inject(Notifications);
  private readonly stateModel = inject(StateModel);
  private readonly tasks = inject(Tasks);
  private readonly transloco = inject(TranslocoService);

  selected?: ProtocolMetaInterface;
  disk: DiskInterface;
  diskSubscription: Subscription | undefined;
  stateSubscription: Subscription | undefined;
  protocolModel: ProtocolModelInterface;
  state: StateInterface;
  selectedSource = 'device';
  gitlabConfig: GitlabConfigInterface;

  constructor() {
    this.disk = this.diskModel.getDisk();
    this.protocolModel = this.protocolM.getProtocolModel();
    this.state = this.stateModel.getState();
    this.gitlabConfig = this.disk.preferences.gitlabConfig;
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

  async fetchGitlabProtocol() {
    this.tasks.register('Add Gitlab Protocol', 'Checking Gitlab Protocol Configuration');
    try {
      if (!this.gitlabConfig.host || !this.gitlabConfig.token || !this.gitlabConfig.group || !this.gitlabConfig.repository) {
        this.notifications
          .alert({
            title: 'Alert',
            content: 'Missing required GitLab configuration. Please specify a GitLab host, token, group, and repository.',
            type: DialogType.Alert,
          })
          .subscribe();
        throw new Error('Missing required GitLab configuration. Please specify a GitLab host, token, group, and repository.');
      }
      // Detect if there "/" in the repository name and alert user
      if (this.gitlabConfig.repository.includes('/')) {
        this.notifications
          .alert({
            title: 'Alert',
            content: "Repository name should not contain any '/'. If applicable, please move the parent directories to the group field.",
            type: DialogType.Alert,
          })
          .subscribe();
        // move the "/" to the group field and remove from repository field
        this.fixGitlabRepositoryAndGroupSlashs();
      }
      // fix issue if a trailing "/" is in the group field
      if (this.gitlabConfig.group.endsWith('/')) {
        this.gitlabConfig.group = this.gitlabConfig.group.slice(0, -1);
      }
      const headers = {
        Authorization: `Bearer ${this.gitlabConfig.token}`,
      };
      const projectId = await this.getGitlabProjectId(this.gitlabConfig.host, this.gitlabConfig.repository, this.gitlabConfig.group, headers);
      const ref = await this.getGitlabRef(projectId, headers);
      const localDir = `.tabsint-protocols/${this.gitlabConfig.repository}`;
      this.tasks.register('Add Gitlab Protocol', 'Download protocol files');
      const [protocolContent, folderUri] = await this.downloadAndSaveFiles(projectId, ref, this.gitlabConfig.host, headers, localDir);

      const protocol = {
        ...partialMetaDefaults,
        version: ref,
        name: this.gitlabConfig.repository,
        server: ProtocolServer.Gitlab,
        contentURI: folderUri,
        admin: false,
        gitlabConfig: { ...this.gitlabConfig, tag: ref },
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

  fixGitlabRepositoryAndGroupSlashs() {
    // handle edge cases related to "/"s
    if (!this.gitlabConfig.group.endsWith('/')) {
      this.gitlabConfig.group = this.gitlabConfig.group + '/';
    }
    if (this.gitlabConfig.repository.endsWith('/')) {
      this.gitlabConfig.repository = this.gitlabConfig.repository.slice(0, -1);
    }
    // move "/"s (directories) from repository to group
    const tmpGroup = this.gitlabConfig.group + this.gitlabConfig.repository.split('/').slice(0, -1).join('/');
    const tmpRepository = this.gitlabConfig.repository.split('/')[this.gitlabConfig.repository.split('/').length - 1];
    this.gitlabConfig.repository = tmpRepository;
    this.gitlabConfig.group = tmpGroup;
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
      const headers = {
        Authorization: `Bearer ${selectedGitlabConfig.token}`,
      };
      const projectId = await this.getGitlabProjectId(
        selectedGitlabConfig.host,
        selectedGitlabConfig.repository,
        selectedGitlabConfig.group,
        headers
      );
      this.logger.debug(`Project id is -- ${projectId}`);
      const latestCommitHash = await this.getLatestCommitHash(selectedGitlabConfig.host, projectId, headers);
      this.logger.debug(`Latest commit hash: ${latestCommitHash}`);

      if (selectedGitlabConfig.tag === latestCommitHash) {
        this.notifications.alert({
          title: 'Up-to-date',
          content: 'Your protocol is already up-to-date.',
          type: DialogType.Confirm,
        });
        return;
      }

      const fileUrl = `${selectedGitlabConfig.host}/api/v4/projects/${projectId}/repository/files/protocol.json/raw?ref=${latestCommitHash}`;

      const latestProtocolJson = await this.fetchGitlabData(fileUrl, headers, 'Failed to fetch protocol.json:');
      const localDir = `.tabsint-protocols/${selectedGitlabConfig.repository}`;
      const localProtocolFile = await this.fileService.readFile(`${localDir}/protocol.json`);

      if (localProtocolFile) {
        const localProtocolJson = JSON.parse(localProtocolFile.content);

        if (_.isEqual(localProtocolJson, latestProtocolJson)) {
          this.notifications.alert({
            title: 'No Changes Detected',
            content: 'The protocol.json file has not changed in the latest commit.',
            type: DialogType.Confirm,
          });
          return;
        }
      } else {
        throw new Error('Could not read local protocol.json file.');
      }

      const [protocolContent, localDirUri] = await this.downloadAndSaveFiles(
        projectId,
        latestCommitHash,
        selectedGitlabConfig.host,
        headers,
        localDir
      );
      const updatedProtocol: ProtocolInterface = {
        ...partialMetaDefaults,
        name: selectedGitlabConfig.repository,
        server: ProtocolServer.Gitlab,
        contentURI: localDirUri,
        admin: false,
        gitlabConfig: { ...selectedGitlabConfig, tag: latestCommitHash },
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

  onGitlabConfigChange(event: any, value: string) {
    if (value == 'host') {
      this.disk.preferences.gitlabConfig.host = event.target.value;
    } else if (value == 'repository') {
      this.disk.preferences.gitlabConfig.repository = event.target.value;
    } else if (value == 'token') {
      this.disk.preferences.gitlabConfig.token = event.target.value;
    } else if (value == 'group') {
      this.disk.preferences.gitlabConfig.group = event.target.value;
    } else if (value == 'tag') {
      this.disk.preferences.gitlabConfig.tag = event.target.value;
    }
    this.diskModel.storeDisk();
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

  private async fetchGitlabData(url: string, headers: { Authorization: string }, errorMessagePrefix: string) {
    const options = {
      url: url,
      headers: headers,
    };

    const response = await CapacitorHttp.get(options);
    if (response.status < 200 || response.status >= 300) {
      if (response.status === 401) {
        throw new Error('Unauthorized: Check your GitLab credentials.');
      }
      throw new Error(`${errorMessagePrefix} ${response.status}`);
    }

    return response.data;
  }

  private async downloadAndSaveFiles(
    projectId: number,
    ref: string,
    host: string,
    headers: { Authorization: string },
    localDir: string
  ): Promise<[ProtocolSchemaInterface, string]> {
    const repoFiles = await this.fetchGitlabData(
      `${host}/api/v4/projects/${projectId}/repository/tree?ref=${ref}&recursive=true`,
      headers,
      'Failed to fetch repository files: '
    );

    if (!repoFiles.length) {
      throw new Error('No files found in the repository.');
    }

    await this.fileService.deleteDirectory(localDir);
    const fileServiceResult = await this.fileService.createDirectory(localDir);

    let protocolContent: ProtocolSchemaInterface | null = null;

    for (const file of repoFiles) {
      const filePath = encodeURIComponent(file.path);
      const fileUrl = `${host}/api/v4/projects/${projectId}/repository/files/${filePath}/raw?ref=${ref}`;

      const options = {
        url: fileUrl,
        responseType: (file.name === 'protocol.json' ? 'json' : 'blob') as any,
        headers: headers,
      };
      const response = await CapacitorHttp.get(options);

      if (response.status < 200 || response.status >= 300) {
        if (response.status === 401) {
          throw new Error('Unauthorized: Check your GitLab credentials.');
        }
        throw new Error(`Error loading repo file ${filePath} ${response.status}`);
      }

      try {
        if (file.name === 'protocol.json') {
          protocolContent = await response.data;
          await this.fileService.writeFile(`${localDir}/protocol.json`, JSON.stringify(protocolContent));
        } else {
          const blob = await response.data;
          await this.fileService.writeBinaryFile(`${localDir}/${file.name}`, blob);
        }
      } catch (e) {
        throw new Error(`Error writing file: ${file.name}`);
      }
    }

    if (!protocolContent) {
      throw new Error('protocol.json not found in repository.');
    }

    return [protocolContent, fileServiceResult?.uri!];
  }

  private async getLatestCommitHash(host: string, projectId: number, headers: { Authorization: string }): Promise<string> {
    const commits = await this.fetchGitlabData(
      `${host}/api/v4/projects/${projectId}/repository/commits?per_page=1`,
      headers,
      'Failed to fetch latest commit: '
    );

    if (!commits.length) throw new Error('No commits found in repository.');
    return commits[0].id.substring(0, 8);
  }

  private async getGitlabRef(projectId: number, headers: { Authorization: string }): Promise<string> {
    if (this.gitlabConfig.tag) {
      return this.gitlabConfig.tag;
    }
    return this.getLatestCommitHash(this.gitlabConfig.host, projectId, headers);
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

  private handleGitlabError(error: any) {
    const errorMessage = error.message || 'An error occurred while fetching the GitLab protocol.';

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

  private async getGitlabProjectId(host: string, repository: string, group: string, headers: { Authorization: string }): Promise<number> {
    const projects = await this.fetchGitlabData(`${host}/api/v4/projects?search=${repository}`, headers, 'Failed to fetch project list: ');

    const matchedProject = projects.find(
      (p: { name: string; namespace: { full_path: string } }) => p.name === repository && p.namespace.full_path.toLowerCase() === group.toLowerCase()
    );

    if (!matchedProject) {
      throw new Error('Project not found. Check the repository name and group.');
    }

    return matchedProject.id;
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
