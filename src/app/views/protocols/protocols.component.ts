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

}
