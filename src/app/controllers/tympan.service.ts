import { Injectable } from '@angular/core';
import { Logger } from '../utilities/logger.service';
import { TympanWrap } from '../utilities/tympan-wrap.service';
import { BleDevice } from '../interfaces/bluetooth.interface';
import { DevicesModel } from '../models/devices/devices.service';
import { DevicesInterface } from '../models/devices/devices.interface';
import { TympanState } from '../utilities/constants';
import { StateModel } from '../models/state/state.service';
import { StateInterface } from '../models/state/state.interface';
import { ConnectedDevice } from '../interfaces/new-device.interface';

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

        for (let i = 0; i < this.devices.connectedDevices.tympan.length; i++) {
            if (this.devices.connectedDevices.tympan[i].id==deviceId) {
                this.devices.connectedDevices.tympan[i].state = TympanState.Disconnected;
            }
        }
    }

    async startScan() {
        let timeout = 30000;
        await this.tympanWrap.startScanning(this.devicesModel.availableDevicesObservable,timeout);
    }

    async stopScan() {
        await this.tympanWrap.stopScanning();
    }

    async connect(tympan:BleDevice, newConnectedDevice:ConnectedDevice) {
        await this.tympanWrap.stopScanning();
            
        console.log("tympan",tympan);
        try {
            await this.tympanWrap.connect(tympan,this.onDisconnect.bind(this));

            var newConnection = newConnectedDevice;
            newConnection["id"] = tympan.deviceId;
            newConnection["name"] = tympan.name;
            newConnection["state"] = TympanState.Connected;

            this.devices.connectedDevices.tympan.push(newConnection);
            this.state.isPaneOpen.tympans = true;
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

    async reconnect(tympanId:string | undefined) {
        // TODO: This return is only needed for tymping, it can likely be improved
        if (!tympanId) {
            console.log("failed to reconnect to tympan:",tympanId);
            return
        }

        try {
            await this.tympanWrap.reconnect(tympanId,this.onDisconnect.bind(this));
            for (let i = 0; i < this.devices.connectedDevices.tympan.length; i++) {
                if (this.devices.connectedDevices.tympan[i].id==tympanId) {
                    this.devices.connectedDevices.tympan[i].state = TympanState.Connected;
                }
            }
        } catch {
            console.log("failed to reconnect to tympan:",tympanId);
        }
    }

    async disconnect(tympanId:string | undefined) {
        // TODO: This return is only needed for tymping, it can likely be improved
        if (!tympanId) {
            console.log("failed to disconnect to tympan:",tympanId);
            return
        }

        await this.tympanWrap.disconnect(tympanId);

        // This shouldnt be needed because it will happen onDisconnect
        // try {
        //     await this.tympanWrap.disconnect(tympanId);
        //     for (let i = 0; i < this.devices.connectedDevices.tympan.length; i++) {
        //         if (this.devices.connectedDevices.tympan[i].id==tympanId) {
        //             this.devices.connectedDevices.tympan[i].state = TympanState.Disconnected;
        //         }
        //     }
        // } catch {
        //     console.log("failed to disconnect to tympan:",tympanId);
        // }
    }
}



