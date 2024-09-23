import { Injectable } from '@angular/core';
import { Logger } from '../utilities/logger.service';
import { TympanWrap } from '../utilities/tympan-wrap.service';
import { DeviceChooseComponent } from '../views/config/config-views/device-choose/device-choose.component';
import { MatDialog } from '@angular/material/dialog';
import { BleDevice } from '../interfaces/bluetooth.interface';
import { StateInterface } from '../models/state/state.interface';
import { StateModel } from '../models/state/state.service';
import { DevicesModel } from '../models/devices/devices.service';

@Injectable({
    providedIn: 'root',
})

export class TympanService {
    state: StateInterface;

    constructor(public tympanWrap: TympanWrap, public dialog: MatDialog, public stateModel: StateModel) {
        this.state = this.stateModel.getState();
    }


    async connect() {
        let devices: BleDevice[] = [];
        try {
            devices = await this.tympanWrap.scan();
        } catch {
            console.log("ERROR WITH TYMPAN WRAP SCANNING");
        }

        console.log("tympanWrap devices:",devices);

        this.dialog.open(DeviceChooseComponent, {data: devices}).afterClosed().subscribe(
            async (tympan: BleDevice | undefined) => {
                if (tympan!=undefined) {
                    console.log("tympan",tympan);
                    try {
                        await this.tympanWrap.connect(tympan);
                        // TODO change this to device
                        // this.state.tympan = TympanState.Connected;
                    } catch {
                        console.log("failed to connect to tympan:",tympan);
                    }
                    
                    let msg = "[8,'requestId']";
                    try {
                        await this.tympanWrap.write(tympan,msg);
                    } catch {
                        console.log("failed to write to tympan with msg: ",msg);
                    }
                }
                
            }
        );
    }
}



