import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { DiskModel } from '../../models/disk/disk.service';
import { Logger } from '../../utilities/logger.service';
import { FileService } from '../../utilities/file.service';
import { AppState } from '../../utilities/constants';
import { StateModel } from '../../models/state/state.service';
import { DiskInterface } from '../../models/disk/disk.interface';
import { StateInterface } from '../../models/state/state.interface';
import { ExamService } from '../../controllers/exam.service';
import { BleClient, numberToUUID } from '@capacitor-community/bluetooth-le';

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
    public examService: ExamService,
    public logger: Logger, 
    public stateModel: StateModel,
    public translate: TranslateService
  ) { 
    this.disk = this.diskModel.getDisk();
    this.state = this.stateModel.getState();
  }

  ngOnInit(): void {
    this.examService.switchToAdminView();
    this.stateModel.setAppState(AppState.Admin);
  }

  title = 'config';

  // TEST FUNCTIONS
  logTest() {
    this.logger.debug("diskM: "+JSON.stringify(this.disk));
  }

  async bleScan() {
    /*
    This function finds all bluetooth devices. We can detect any devices we need.
    
    NOTES FOR CHA / TYMPAN INTEGRATION:

    For tympan we should be okay to proceed with regular BLE commands.

    For WAHTS we need CHAWRAP or develop a new tool that does something similar.
    This might be a good time to think about who owns CHAWRAP etc. Do we maintain? Is it needed?
    Do we expect open source tabsint to have all WAHTS stuff open? Or would you need special TabSINT to use WAHTS?
    We could potentially have TabSINT load in libraries used to communicate with proprietary devices.
    Or we could have the WAHTS code in place for everybody to see, but require some encryption key to work?

    Options for CHAWRAP integration
    1) Add it in via cordova plugin (would rather not use outdated tools)
    2) Convert to a capacitor plugin (preferred option)
      - capacitor-plugin-creare-cha
        - CHAWRAP is here
        - Also requires the compiled CHA.jar (comes from SVN firmware and gets compiled)
    3) Rewrite into tabsint as open-source (IP issues?)

    WHO WILL MAINTAIN CHAWRAP?

    Note that when TabSINT builds looks for the CHAWRAP and related files and adds them in.
    It is not currently in TabSINT although the cordova-plugin-creare-cha repo is publicly available.
    However, there is a layer of obfuscation since CHA.jar is a compiled file. I am not sure why it is done
    this way. If it is to protect IP we should be wary of that and come up with a solution to continue to protect IP.
    Otherwise we might have more flexibility.
    */


    let results:any = []
    try {
      await BleClient.initialize();
      
      console.log("starting ble scan");
      await BleClient.requestLEScan(
        {
          // services: [],
        },
        (result:any) => {
          results.push(result);
        }
      );
  
      setTimeout(async () => {
        await BleClient.stopLEScan();
        console.log('stopping ble scan');
        console.log('detected devices:',results);
      }, 5000);

    } catch (error) {
      console.error(error);
    }
  }

  
}
