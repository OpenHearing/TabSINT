import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import _ from 'lodash';
import { DialogDataInterface } from '../../interfaces/dialog-data.interface';
import { ProtocolSchemaInterface } from '../../interfaces/protocol-schema.interface';
import { StateInterface } from '../../models/state/state.interface';
import { GitlabConfigInterface, ProtocolInterface, ProtocolMetaInterface, ProtocolModelInterface } from '../../models/protocol/protocol.interface';
import { DiskInterface } from '../../models/disk/disk.interface';
import { DiskModel } from '../../models/disk/disk.service';
import { ProtocolModel } from '../../models/protocol/protocol-model.service';
import { StateModel } from '../../models/state/state.service';
import { ProtocolService } from '../../controllers/protocol.service';
import { ExamService } from '../../controllers/exam.service';
import { Logger } from '../../utilities/logger.service';
import { Notifications } from '../../utilities/notifications.service';
import { Tasks } from '../../utilities/tasks.service';
import { FileService } from '../../utilities/file.service';
import { DialogType, ProtocolServer } from '../../utilities/constants';
import { getProtocolMetaData } from '../../utilities/protocol-helper-functions';
import { partialMetaDefaults } from '../../utilities/defaults';

@Component({
  selector: 'protocols-view',
  templateUrl: './protocols.component.html',
  styleUrl: './protocols.component.css'
})
export class ProtocolsComponent {
  selected?: ProtocolMetaInterface;
  disk: DiskInterface;
  diskSubscription: Subscription | undefined;
  protocolModel: ProtocolModelInterface;
  state: StateInterface;
  selectedSource = 'device';
  gitlabConfig: GitlabConfigInterface;

  constructor (
    private readonly diskModel: DiskModel,
    private readonly examService: ExamService,
    private readonly protocolM: ProtocolModel,
    private readonly protocolService: ProtocolService,
    private readonly fileService: FileService,
    private readonly logger: Logger,
    private readonly notifications: Notifications,
    private readonly stateModel: StateModel,
    private readonly tasks: Tasks,
    private readonly translate: TranslateService,
  ) {
    this.disk = this.diskModel.getDisk();
    this.protocolModel = this.protocolM.getProtocolModel();
    this.state = this.stateModel.getState();
    this.gitlabConfig = this.protocolM.getGitlabConfigModel();
  }

  ngOnInit(): void {
    this.diskSubscription = this.diskModel.diskSubject.subscribe( (updatedDisk: DiskInterface) => {
      this.disk = updatedDisk;
    })    
    // sort protocols by name here
  }

  ngOnDestroy() {
    this.diskSubscription?.unsubscribe();
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
      return "active-row";
    } else if (this.selected === null || this.selected === undefined) {
      return "";
    } else if (_.isEqual(this.selected.name, p.name)) {
      return "table-selected";
    } else {
      return "";
    }
  };

  /**
   * Add protocols to protocols table
   * @summary Launch file chooser, extract meta data from selected protocol folder, 
   * save it to disk model, then retrieve protocol model to refresh the view.
   * @models dik, protocol
   */
  async addProtocols() {
    try {
      const result = await this.fileService.launchFileChooser();
      if (!result) {
        this.logger.error("There was an error in choosing the folder");
      }
      let protocolsFolderUri = result?.uri;
      let protocolName = result?.name;
      const resultFromListFiles = await this.fileService.listDirectory(protocolsFolderUri);
      const fileList = resultFromListFiles?.files;
        for (const file of fileList!) {
          if (file.name=="protocol.json") {
            const protocolContent: ProtocolSchemaInterface = JSON.parse(file.content);
            const protocol: ProtocolInterface = {
              ...partialMetaDefaults, 
              name: protocolName!, 
              contentURI: protocolsFolderUri!, 
              server: ProtocolServer.LocalServer,
              admin: false,
              ...protocolContent
            };
            const protocolMetaData: ProtocolMetaInterface = getProtocolMetaData(protocol);
            let availableMetaProtocols = this.disk.availableProtocolsMeta;
            availableMetaProtocols[protocolMetaData.name] = protocolMetaData;
            this.diskModel.updateDiskModel('availableProtocolsMeta', availableMetaProtocols);
            this.protocolModel = this.protocolM.getProtocolModel();
            this.select(protocolMetaData);
            this.loadProtocol();
          }
      }
    }
    catch (error) {
      this.logger.error(""+ error);
    }
  }

  async fetchGitlabProtocol() {
    try {
      if (!this.gitlabConfig.host || !this.gitlabConfig.token || !this.gitlabConfig.group || !this.gitlabConfig.repository) {
        this.notifications.alert({
          title: "Alert",
          content: "Missing required GitLab configuration. Please specify a GitLab host, token, group, and repository.",
          type: DialogType.Alert
        }).subscribe();
        throw new Error("Missing required GitLab configuration. Please specify a GitLab host, token, group, and repository.");
      } else if (this.gitlabConfig.group.endsWith('/')) {
        this.notifications.alert({
          title: "Alert",
          content: "GitLab configuration typo. Please make sure the group does not have a '/' at the end.",
          type: DialogType.Alert
        }).subscribe();
        throw new Error("GitLab configuration typo. Please make sure the group does not have a '/' at the end.");
      }
      const headers = new Headers({ 'PRIVATE-TOKEN': this.gitlabConfig.token });
      const projectId = await this.getGitlabProjectId(this.gitlabConfig.host,this.gitlabConfig.repository,this.gitlabConfig.group,headers)
      const ref = await this.getGitlabRef(projectId, headers);
      const localDir = `.tabsint-protocols/${this.gitlabConfig.repository}`;
      const [protocolContent, folderUri] = await this.downloadAndSaveFiles(projectId, ref, this.gitlabConfig.host,headers, localDir);
      

    const protocol = {
      ...partialMetaDefaults,
      name: this.gitlabConfig.repository,
      server: ProtocolServer.Gitlab,
      contentURI: folderUri,
      admin: false,
      gitlabConfig: { ...this.gitlabConfig, tag: ref },
      ...protocolContent
    };

    this.updateDiskModel(protocol);

    this.notifications.alert({
        title: "Success",
        content: `Protocol '${protocol.name}' imported successfully from GitLab.`,
        type: DialogType.Confirm
    });

    } catch (error: any) {
        this.handleGitlabError(error);
    }
  }

  

  isProtocolActive(): boolean {
    return this.isActive(this.selected);
  }

  isButtonDisabled(): boolean {
    return !this.selected;
  };

  showUpdateButton(): boolean {
    if (!this.selected) {
      return false;
    }
    return this.selected.server === ProtocolServer.Gitlab;
  };

  showDeleteButton(): boolean {
    if (!this.selected) {
      return false;
    }
    return this.selected.server !== ProtocolServer.Developer;
  };

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

    this.tasks.register("updating", "Loading Protocol...");

    let protocolMetaData = getProtocolMetaData(this.selected);

    if (!this.protocolModel.activeProtocol) {
      await this.protocolService.load(protocolMetaData, true);
    } else {
      let msg: DialogDataInterface = {
        title: "Confirm",
        content: `Switch to protocol ${this.selected.name} and reset the current test? The current test results will be deleted`,
        type: DialogType.Confirm
        };
      if (this.isActive(this.selected)) {
        msg.content = `Overwrite protocol ${this.selected.name} and reset the current test? The current test will be reset`;
      }

      this.notifications.alert(msg).subscribe(async result => {
        if (result === "OK") {
          await this.protocolService.load(protocolMetaData, true);
          this.examService.reset();
        }
      });
    }
    this.tasks.deregister("updating");
  };

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
  };

  async update(): Promise<void> {
    if (!this.selected || this.selected.server !== ProtocolServer.Gitlab) {
        this.notifications.alert({
            title: "Error",
            content: "Selected protocol was not imported from GitLab.",
            type: DialogType.Alert
        });
        return;
    }

    try {
        this.tasks.register("updating", `Checking for updates for ${this.selected.name}...`);

        const selectedGitlabConfig = this.selected.gitlabConfig;
        if (!selectedGitlabConfig) {
            throw new Error("GitLab configuration is missing for the selected protocol.");
        }
        this.logger.debug("Printing selected protocols gitlab configuration")
        this.logger.debug(JSON.stringify(selectedGitlabConfig));
        if(!selectedGitlabConfig.host || !selectedGitlabConfig.token || !selectedGitlabConfig.group || !selectedGitlabConfig.repository) {
          throw new Error("Missing required GitLab configuration. Please specify a GitLab host, token, group, and repository.");
        }
        const headers = new Headers({ 'PRIVATE-TOKEN': selectedGitlabConfig.token });
        const projectId = await this.getGitlabProjectId(selectedGitlabConfig.host,selectedGitlabConfig.repository,selectedGitlabConfig.group,headers);
        this.logger.debug(`Project id is -- ${projectId}`);
        const latestCommitHash = await this.getLatestCommitHash(selectedGitlabConfig.host,projectId, headers);
        this.logger.debug(`Latest commit hash: ${latestCommitHash}`);

        if (selectedGitlabConfig.tag === latestCommitHash) {
            this.notifications.alert({
                title: "Up-to-date",
                content: "Your protocol is already up-to-date.",
                type: DialogType.Confirm
            });
            this.tasks.deregister("updating");
            return;
        }

        this.logger.debug(`Protocol is outdated. Checking if protocol.json has changed...`);

        const fileUrl = `${selectedGitlabConfig.host}/api/v4/projects/${projectId}/repository/files/protocol.json/raw?ref=${latestCommitHash}`;

        const latestProtocolJson = await this.fetchGitlabData(fileUrl,headers,"Failed to fetch protocol.json:",)
        const localDir = `.tabsint-protocols/${selectedGitlabConfig.repository}`;
        const localProtocolFile = await this.fileService.readFile(`${localDir}/protocol.json`);

        if (localProtocolFile) {
            const localProtocolJson = JSON.parse(localProtocolFile.content);

            if (_.isEqual(localProtocolJson, latestProtocolJson)) {
                this.notifications.alert({
                    title: "No Changes Detected",
                    content: "The protocol.json file has not changed in the latest commit.",
                    type: DialogType.Confirm
                });
                this.tasks.deregister("updating");
                return;
            }
        } else {
          throw new Error("Could not read local protocol.json file.");
        }
        
        this.logger.debug(`protocol.json has changed. Updating protocol...`);

        const [protocolContent,localDirUri] = await this.downloadAndSaveFiles(projectId,latestCommitHash,selectedGitlabConfig.host,headers,localDir);
        const updatedProtocol: ProtocolInterface = {
            ...partialMetaDefaults,
            name: selectedGitlabConfig.repository,
            server: ProtocolServer.Gitlab,
            contentURI: localDirUri,
            admin: false,
            gitlabConfig: { ...selectedGitlabConfig, tag: latestCommitHash },
            ...protocolContent
        };

        this.updateDiskModel(updatedProtocol);

        this.notifications.alert({
            title: "Success",
            content: `Protocol '${this.selected?.name}' has been updated successfully.`,
            type: DialogType.Confirm
        });

    } catch (error: any) {
        this.handleGitlabError(error);
    } finally {
        this.tasks.deregister("updating");
    }
}




  gitlabButtonClass(): string {
    return this.disk.server === ProtocolServer.Gitlab
    ? 'active'
    : 'disabled';
  };

  localServerButtonClass(): string {
    return this.disk.server === ProtocolServer.LocalServer
    ? 'active'
    : '';
  };

  /**
   * Checks whether a protocol is active.
   * @summary Checks if the input protocol is the same
   * as the one on the protocolModel.activeProtocol object.
   * @models protocol
   * @param p protocol to check whether it is active or not
   * @returns whether protocol is active: boolean
   */
  private isActive(p: ProtocolMetaInterface | undefined): boolean {
    return (this.protocolModel.activeProtocol
            && p
            && this.protocolModel.activeProtocol.name == p.name
            && this.protocolModel.activeProtocol.path == p.path)
        || false;
  };

  private async fetchGitlabData(url: string, headers: Headers, errorMessagePrefix: string) {
    const response = await fetch(url, { headers });

    if (!response.ok) {
        if (response.status === 401) throw new Error("Unauthorized: Check your GitLab credentials.");
        throw new Error(`${errorMessagePrefix} ${response.statusText}`);
    }

    return response.json();
  }

  private async downloadAndSaveFiles(projectId: number, ref: string, host:string, headers: Headers, localDir: string): Promise<[ProtocolSchemaInterface, string]> {
    const repoFiles = await this.fetchGitlabData(
        `${host}/api/v4/projects/${projectId}/repository/tree?ref=${ref}&recursive=true`,
        headers,
        "Failed to fetch repository files: "
    );

    if (!repoFiles.length) {
        throw new Error("No files found in the repository.");
    }

    await this.fileService.deleteDirectory(localDir);
    const fileServiceResult = await this.fileService.createDirectory(localDir);

    let protocolContent: ProtocolSchemaInterface | null = null;

    for (const file of repoFiles) {
        const filePath = encodeURIComponent(file.path);
        const fileUrl = `${host}/api/v4/projects/${projectId}/repository/files/${filePath}/raw?ref=${ref}`;
        const response = await fetch(fileUrl, { headers });

        if (!response.ok) {
            throw new Error(`Failed to fetch ${file.name}: ${response.statusText}`);
        }

        if (file.name === "protocol.json") {
            protocolContent = await response.json();
            await this.fileService.writeFile(`${localDir}/protocol.json`, JSON.stringify(protocolContent));
        } else {
            const blob = await response.blob();
            await this.fileService.writeBinaryFile(`${localDir}/${file.name}`, blob);
        }
    }

    if (!protocolContent) {
        throw new Error("protocol.json not found in repository.");
    }

    return [protocolContent,fileServiceResult?.uri!];
}


  private async getLatestCommitHash(host:string,projectId: number, headers: Headers): Promise<string> {
    const commits = await this.fetchGitlabData(
        `${host}/api/v4/projects/${projectId}/repository/commits?per_page=1`,
        headers,
        "Failed to fetch latest commit: "
    );

    if (!commits.length) throw new Error("No commits found in repository.");
    return commits[0].id;
  }

  private async getGitlabRef(projectId: number, headers: Headers): Promise<string> {
    if (this.gitlabConfig.tag) {
        return this.gitlabConfig.tag;
    }
    return this.getLatestCommitHash(this.gitlabConfig.host,projectId, headers)
  }


  private updateDiskModel(protocol: ProtocolInterface) {
    const protocolMetaData: ProtocolMetaInterface = getProtocolMetaData(protocol);
    let availableMetaProtocols = this.disk.availableProtocolsMeta;
    availableMetaProtocols[protocolMetaData.name] = protocolMetaData;

    this.diskModel.updateDiskModel('availableProtocolsMeta', availableMetaProtocols);
    this.protocolModel = this.protocolM.getProtocolModel();
    this.select(protocolMetaData);
    this.loadProtocol();
  }

  private handleGitlabError(error: any) {
    let errorMessage = error.message || "An error occurred while fetching the GitLab protocol.";

    if (errorMessage.includes("Unauthorized")) {
        this.notifications.alert({
            title: "Unauthorized",
            content: "Check your GitLab credentials.",
            type: DialogType.Alert
        });
    } else {
        this.notifications.alert({
            title: "Error",
            content: errorMessage,
            type: DialogType.Alert
        });
    }
  }

  private async getGitlabProjectId(host:string, repository: string, group:string, headers: Headers): Promise<number> {
    const projects = await this.fetchGitlabData(
        `${host}/api/v4/projects?search=${repository}`,
        headers,
        "Failed to fetch project list: "
    );

    const matchedProject = projects.find((p: { name: string; namespace: { full_path: string } }) =>
        p.name === repository && p.namespace.full_path === group
    );

    if (!matchedProject) {
        throw new Error("Project not found. Check the repository name and group.");
    }

    return matchedProject.id;
  }

  toggleValidateProtocols() {
    this.diskModel.updateDiskModel('validateProtocols', !this.disk.validateProtocols);
  }

  validateProtocolPopover = this.translate.instant(
    "Validate protocols against the <b>Protocol Schema</b> before loading into the application. <br /><br /> The protocol schema defines the allowable inputs for use in protocols."
  );

  protocolServerPopover = this.translate.instant(
    "Choose the location to use as the protocol source and results output. <br /><br />Additional configuration for <b>Gitlab</b> will become active below this box when it is selected"
  );

  protocolTablePopover = this.translate.instant(
    "The table below shows a list of the available test protocols within TabSINT. You can select a protocol by pressing on the table row, then <b>load</b>, <b>update</b>, or <b>delete</b> the protocol using the buttons below. <br /><br />" +
      "Protocols can be added from each of the servers listed on the <i>Configuration</i> page using the pane below this one. The input area will change depending on the server selected."
  );

  mediaTablePopover = this.translate.instant(
    "This table shows a list of the downloaded media repositories. " +
      "These repositories can be referenced by any protocols using the <code>mediaRepository</code> key in the top level of the protocol. <br /><br />" +
      "Media repositories will be downloaded from the Gitlab Server defined in the <b>Gitlab Configuration</b> pane under the <i>Configuration</i> tab."
  );

  mediaAddPopover = this.translate.instant(
    "Type in the name of a repository to use as a common media repository. <br /><br />" +
      "The repository must be located on the host in the group defined in the <b>Gitlab Configuration</b> pane under the <i>Configuration</i> tab."
  );

  serverDefaultPopover = this.translate.instant(
    "Reset all configuration values to the defaults set in the build configuaration file. This file can only be edited when TabSINT is built from source code."
  );

  gitlabAddPopover = this.translate.instant(
    "Type in the name of the protocol repository located on the host and group"
  );

  gitlabAddVersionPopover = this.translate.instant(
    "<strong>OPTIONAL:</strong> Type in the repository tag for the version of the repository you would like to download. Leave blank to download the latest tag/commit from the repository."
  );

  gitlabHostPopover = this.translate.instant(
    'Hostname of the gitlab server instance you are running. Generally this will be "https://gitlab.com/"'
  );

  gitlabTokenPopover = this.translate.instant(
    "The secret token used to access your gitlab repositories. See the user guide for more information about finding the Token."
  );

  gitlabNamespacePopover = this.translate.instant(
    "The group where protocol, media, and result repositories are stored."
  );

  gitlabUseTagsPopover = this.translate.instant(
    "By default, TabSINT will track changes to protocol files based on the <b>tags</b> to a repository.<br /><br />" +
      "Uncheck this box if you would only like to download changes that are associated with repository <b>commits</b>."
  );

  gitlabUseSeperateResultsRepoPopover = this.translate.instant(
    "Select this option to choose a different gitlab group or repository for results upload.  <br /><br />By default, results are uploaded to a <code>results</code> repository in the same group that contains the protocol."
  );

  gitlabResultsGroupPopover = this.translate.instant(
    "Type the group that contains the <b>Results Repository</b> specified below. <br /><br /> <i>Note: This group must use the same <b>Host</b> and <b>Token</b> above.</i>"
  );

  gitlabResultsRepoPopover = this.translate.instant(
    "Type the name of the repository where results will be uploaded. To avoid errors, please create the repository before trying to upload results to it.<br /><br /> <i>Note: This repository must use the same <b>Host</b> and <b>Token</b> above.</i>"
  );

  downloadCreareProtocolsPopover = this.translate.instant(
    "Select this option to download standard protocols from Creare.  Results will still go to the gitlab host, group, and repository defined in <b>Gitlab Configuration</b> on the <i>Configuration</i> tab.  When this option is not selected, protocols are downloaded from the host and group defined in <b>Gitlab Configuration</b> on the <i>Configuration</i> tab."
  );

  localAddPopover = this.translate.instant(
    "The local directory under <code>Documents/tabsint-protocols</code> where the protocol is stored on the tablet. Press <b>Add</b> to select a protocol directory via a file chooser."
  );

}
