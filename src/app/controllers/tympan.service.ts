import { Injectable } from '@angular/core';
import { Logger } from '../utilities/logger.service';
import { TympanWrap } from '../utilities/tympan-wrap.service';
import { BleDevice } from '../interfaces/bluetooth.interface';
import { DevicesModel } from '../models/devices/devices.service';
import { DevicesInterface } from '../models/devices/devices.interface';
import { ConnectedTympan } from '../interfaces/connected-tympan.interface';
import { TympanState } from '../utilities/constants';
import { StateModel } from '../models/state/state.service';
import { StateInterface } from '../models/state/state.interface';

@Injectable({
    providedIn: 'root',
})

export class TympanService {
    devices: DevicesInterface;
    state: StateInterface

    constructor(
        public tympanWrap: TympanWrap, 
        public devicesModel: DevicesModel,
        public stateModel: StateModel
    ) {
        this.devices = this.devicesModel.getDevices();
        this.state = this.stateModel.getState();
    }

    onDisconnect(deviceId:string): void {
        console.log(`device ${deviceId} disconnected`);
        this.devices.connectedDevices.tympan[0].state = TympanState.Disconnected;
    }

    async startScan() {
        let timeout = 30000;
        await this.tympanWrap.startScanning(this.devicesModel.availableDevicesObservable,timeout);
    }

    async stopScan() {
        await this.tympanWrap.stopScanning();
    }

    async connect(tympan:BleDevice) {
        await this.tympanWrap.stopScanning();
            
        console.log("tympan",tympan);
        try {
            await this.tympanWrap.connect(tympan,this.onDisconnect.bind(this));

            var newConnection:ConnectedTympan;
            newConnection = {
                "id": tympan.deviceId,
                "name": tympan.name,
                "state": TympanState.Connected
            }
            this.devices.connectedDevices.tympan.push(newConnection);
            this.state.newDeviceConnection = false;
        } catch {
            console.log("failed to connect to tympan:",tympan);
        }
        
        // let msg = "[8,'requestId']";
        // try {
        //     await this.tympanWrap.write(tympan,msg);
        // } catch {
        //     console.log("failed to write to tympan with msg: ",msg);
        // }
            
    }
}



