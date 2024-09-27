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
        public stateModel: StateModel,
        public logger: Logger
    ) {
        this.devices = this.devicesModel.getDevices();
        this.state = this.stateModel.getState();
    }

    onDisconnect(deviceId:string): void {
        this.logger.debug(`device ${deviceId} disconnected`);

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
            
        this.logger.debug("attempting to connect to tympan : "+JSON.stringify(tympan));
        try {
            await this.tympanWrap.connect(tympan,this.onDisconnect.bind(this));

            var newConnection = newConnectedDevice;
            newConnection["id"] = tympan.deviceId;
            newConnection["name"] = tympan.name;
            newConnection["state"] = TympanState.Connected;

            this.devices.connectedDevices.tympan.push(newConnection);
            this.state.isPaneOpen.tympans = true;
        } catch {
            this.logger.error("failed to connect to tympan: "+JSON.stringify(tympan));
        }
        
        // let msg = "[8,'requestId']";
        // try {
        //     await this.tympanWrap.write(tympan,msg);
        // } catch {
        //     this.logger.error("failed to write to tympan with msg: "+JSON.stringify(msg));
        // }
            
    }

    async reconnect(tympanId:string | undefined) {
        // TODO: This return is only needed for tymping, it can likely be improved
        if (!tympanId) {
            this.logger.debug("failed to reconnect to tympan: "+JSON.stringify(tympanId));
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
            this.logger.error("failed to reconnect to tympan: "+JSON.stringify(tympanId));
        }
    }

    async disconnect(tympanId:string | undefined) {
        // TODO: This return is only needed for tymping, it can likely be improved
        if (!tympanId) {
            this.logger.debug("failed to disconnect to tympan: "+JSON.stringify(tympanId));
            return
        }

        await this.tympanWrap.disconnect(tympanId);
    }



    // TODO: Move this to a utility? Or some better place?
    getNextFreeDeviceId() {
        let nextFreeId: string = "1";
        let takenIds: Array<string> = [];
        for (const [key, devices] of Object.entries(this.devices.connectedDevices)) {
            for (let i = 0; i < devices.length; i++) {
                takenIds.push(devices[i].deviceId);
            }
        }
        while (takenIds.includes(nextFreeId)) {
            nextFreeId = (parseInt(nextFreeId)+1).toString();
        }
        return nextFreeId
    }

}



