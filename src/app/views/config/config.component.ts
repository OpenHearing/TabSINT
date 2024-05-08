import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { DiskModel } from '../../models/disk/disk.service';
import { Logger } from '../../utilities/logger.service';
import { FileService } from '../../controllers/file.service';
import { AppState } from '../../utilities/constants';
import { StateModel } from '../../models/state/state.service';
import { DiskInterface } from '../../models/disk/disk.interface';
import { StateInterface } from '../../models/state/state.interface';

@Component({
  selector: 'config-view',
  templateUrl: './config.component.html',
  styleUrl: './config.component.css'
})
export class ConfigComponent {
  disk: DiskInterface;
  state: StateInterface;

  constructor(
    public diskModel: DiskModel, 
    public fileService: FileService,
    public logger: Logger, 
    public stateModel: StateModel,
    public translate: TranslateService
  ) { 
    this.disk = this.diskModel.getDisk();
    this.state = this.stateModel.getState();
  }

  ngOnInit(): void {
    this.stateModel.setAppState(AppState.Admin);
  }

  title = 'config';

  // TEST FUNCTIONS
  logTest() {
    this.logger.debug("diskM: "+JSON.stringify(this.disk));
  }
  
}
