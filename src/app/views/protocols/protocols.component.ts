import { Component } from '@angular/core';
import { DiskM } from '../../models/disk/disk.service';
import { Logger } from '../../utilities/logger.service';
import _ from 'lodash';
import { ProtocolModel } from '../../models/protocol/protocol.interface';
import { Protocol } from '../../controllers/protocol.service';
import { ProtocolServer, Server } from '../../utilities/constants';

@Component({
  selector: 'protocols-view',
  templateUrl: './protocols.component.html',
  styleUrl: './protocols.component.css'
})
export class ProtocolsComponent {
  selected?: ProtocolModel;

  constructor (
    public diskM: DiskM,
    private logger: Logger,
    public protocol: Protocol
  ) {}

  ngOnInit(): void {
    this.logger.debug("protocols");
    // sort protocols by name here
  }

  select(p: ProtocolModel): void {
    this.selected = p;
  }

  pclass(p: ProtocolModel): string {
    if (this.protocol.isActive(p)) {
      return "active-row";
    } else if (this.selected === null || this.selected === undefined) {
      return "";
    } else if (_.isEqual(this.selected!.name, p.name)) {
      return "table-selected";
    } else {
      return "";
    }
  };

  isButtonDisabled(): Boolean {
    return !this.selected; // || tasks.disabled;
  };

  showUpdateButton(): Boolean {
    if (!this.selected) {
      return false;
    } else if (this.selected.server === ProtocolServer.Gitlab) {
      return true;
    } else if (this.selected.server === ProtocolServer.LocalServer) {
      return false;
    } else if (this.selected.server === ProtocolServer.Developer) {
      return false;
    } else {
      return false;
    }
  };

  showDeleteButton(): Boolean {
    if (!this.selected) {
      return false;
    }
    return this.selected.server !== ProtocolServer.Developer;
  };

  load(): void {
    if (!this.selected) {
        return;
    }
    this.protocol.load(this.selected, this.diskM.diskM.validateProtocols, true, true);
    // if no protocol is available, load it
    // if (!pm.root) {
    //     loadAndReset(false);
    // } else {
        // otherwise, notify user appropriately and loadAndReset()
        // let msg =
        //     $localize `Switch to protocol ${this.selected.name} and reset the current test? The current test results will be deleted`;
        // if (this.protocol.isActive(this.selected)) {
        //     msg =
        //         $localize `Reload protocol ${this.selected.name} and reset the current test? The current test will be reset`;
        // }

        // notifications.confirm(msg, function(buttonIndex) {
        //     if (buttonIndex === 1) {
        //         if (!this.protocol.isActive(this.selected)) {
        //             loadAndReset(false);
        //         } else if (this.protocol.isActive(sthis.elected)) {
        //             loadAndReset(true);
        //         }
        //     }
        // });
    // }

    // function loadAndReset(reload: boolean): void {
    //     tasks
    //         .register("updating", "Loading Protocol...")
    //         .then(function() {
    //             return protocol.load(selected, disk.validateProtocols, true, reload);
    //         })
    //         .then(function() {
    //             if (protocol.isActive(selected)) {
    //                 examLogic.reset();
    //             }
    //         })
    //         .finally(function() {
    //             tasks.deregister("updating");
    //         });
    // }
  };

  delete(): void {
      if (!this.selected) {
          return;
      }

      this.protocol.delete(this.selected);
      this.selected = undefined;
      // notifications.confirm(
      //     gettextCatalog.getString("Delete protocol ") +
      //     this.selected.name +
      //     gettextCatalog.getString(" and remove protocol files from disk?"),
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
      //     notifications.alert(gettextCatalog.getString("Task still in progress..."));
      //     return;
      // }

      // if (protocol.isActive(selected)) {
      //     notifications.confirm(
      //         gettextCatalog.getString("Update protocol ") +
      //         this.selected.name +
      //         "? " +
      //         gettextCatalog.getString("The current test will be reset"),
      //         function(buttonIndex) {
      //             if (buttonIndex === 1) {
      //                 tasks.register("updating", "Updating Protocol");
      //                 updateProtocol()
      //                     .then(function() {
      //                         return protocol.load(this.selected, this.diskM.diskM.validateProtocols, false);
      //                     })
      //                     .then(examLogic.reset)
      //                     .finally(function() {
      //                         tasks.deregister("updating");
      //                     });
      //             }
      //         }
      //     );
      // } else {
      //     notifications.confirm(gettextCatalog.getString("Update protocol ") + this.selected.name + "?", function(
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
      //                 const pidx = _.findIndex(this.diskM.diskM.loadedProtocols, {
      //                     path: paths.data(paths.gitlab(repo))
      //                 });
      //                 if (pidx !== -1) {
      //                     this.diskM.diskM.loadedProtocols[pidx] = gitlab.defineProtocol(repo);
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
      //                         gettextCatalog.getString(
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

}
