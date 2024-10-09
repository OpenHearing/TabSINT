import { Component } from '@angular/core';
import _ from 'lodash';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';


import { DialogDataInterface } from '../../interfaces/dialog-data.interface';
import { ProtocolSchemaInterface } from '../../interfaces/protocol-schema.interface';
import { StateInterface } from '../../models/state/state.interface';
import { ProtocolInterface, ProtocolMetaInterface, ProtocolModelInterface } from '../../models/protocol/protocol.interface';
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
    console.log('select fired');
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
          }
      }
    }
    catch (error) {
      this.logger.error(""+ error);
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

  update(): void { //this is for Gitlab server, do this later
      if (!this.selected) {
          return;
      }

      // check to see if task is already running (shouldn't even be able to get to this state)
      // if (tasks.isOngoing("updating")) {
      //   this.logger.warn("Task still in progress...");
      //     notifications.alert("Task still in progress..."));
      //     return;
      // }

      // if (protocol.isActive(selected)) {
      //     notifications.alert(
      //         "Update protocol ") +
      //         this.selected.name +
      //         "? " +
      //         "The current test will be reset"),
      //         function(buttonIndex) {
      //             if (buttonIndex === 1) {
      //                 tasks.register("updating", "Updating Protocol");
      //                 updateProtocol()
      //                     .then(function() {
      //                         return protocol.load(this.selected, this.disk.validateProtocols, false);
      //                     })
      //                     .then(examLogic.reset)
      //                     .finally(function() {
      //                         tasks.deregister("updating");
      //                     });
      //             }
      //         }
      //     );
      // } else {
      //     notifications.alert("Update protocol ") + this.selected.name + "?", function(
      //         buttonIndex
      //     ) {
      //         if (buttonIndex === 1) {
      //             tasks.register("updating", "Updating Protocol");
      //             updateProtocol().finally(function() {
      //                 tasks.deregister("updating");
      //             });
      //         }
      //     });
      // }

      // const updateProtocol = (): Promise<any> => {
      //     if (this.selected!.server === ProtocolServer.Gitlab) {
      //         return gitlab
      //             .pull(this.selected!.repo)
      //             .then((repo) => {
      //                 // update protocols on disk
      //                 const pidx = _.findIndex(this.disk.loadedProtocols, {
      //                     path: paths.data(paths.gitlab(repo))
      //                 });
      //                 if (pidx !== -1) {
      //                     this.disk.loadedProtocols[pidx] = gitlab.defineProtocol(repo);
      //                     return autoConfig.checkMedia(this.selected);
      //                 } else {
      //                   this.logger.error("Protocol path was not found in disk.protocols");
      //                     return $q.reject();
      //                 }
      //             })
      //             .catch((e: Error) => {
      //                 if (e && e.message) {
      //                     notifications.alert(e.message);
      //                 } else {
      //                     this.logger.error(
      //                         `Unknown failure while pulling gitlab protocol ${
      //                           this.selected.repo.host
      //                         } ${this.selected.repo.group} ${this.selected.repo.name} ${
      //                           this.selected.repo.token
      //                         } with error: ${angular.toJson(e)}`
      //                     );
      //                     notifications.alert(
      //
      //                             "TabSINT encountered an issue while updating the repository. Please verify the repository location and version and upload the application logs if the issue persists."
      //                         )
      //                     );
      //                 }
      //             });
      //     } else {
      //         // handle other server types if needed
      //         return Promise.resolve();
      //     }
      // }
  };

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

  toggleValidateProtocols() {
    this.diskModel.updateDiskModel('validateProtocols', !this.disk.validateProtocols);
  }

  validateProtocolPopover = this.translate.instant(
    "Validate protocols against the <b>Protocol Schema</b> before loading into the application. <br /><br /> The protocol schema defines the allowable inputs for use in protocols."
  );

  protocolServerPopover = this.translate.instant(
    "Choose the data store to use as the protocol source and results output. <br /><br />Additional configuration for the <b>TabSINT Server</b> and <b>Gitlab</b> will become active below this box when a server is selected"
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
    "Type in the name of the protocol repository located on the host and group defined in the <b>Advanced Gitlab Settings</b>"
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

  tabsintAddPopover = this.translate.instant(
    "Type in the <b>Site Name</b> to download from the TabSINT Server defined in the <b>TabSINT Server Configuration</b> advanced settings below."
  );

  tabsintUrlPopover = this.translate.instant(
    'Host URL of the TabSINT server. Generally this will be "https://hffd.crearecomputing.com/"'
  );

  tabsintUsernamePopover = this.translate.instant(
    "The username used to access the TabSINT server"
  );

  tabsintPasswordPopover = this.translate.instant(
    "The password used to access the TabSINT server"
  );

  serverAuthorizePopover = this.translate.instant(
    "If TabSINT Server configuration values are not valid, TabSINT will not be able to download protocols or upload results. Tap <strong>Validate Now</strong> to ensure configuration parameters are valid. <br /><br /> Validation may take up to 15 seconds."
  );

}
