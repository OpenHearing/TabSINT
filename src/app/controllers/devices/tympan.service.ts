import { Injectable } from '@angular/core';
import { Logger } from '../../utilities/logger.service';
import { TympanWrap } from '../../utilities/tympan-wrap.service';
import { BleDevice } from '../../interfaces/bluetooth.interface';
import { DevicesModel } from '../../models/devices/devices.service';
import { DevicesInterface } from '../../models/devices/devices.interface';
import { TympanState } from '../../utilities/constants';
import { StateModel } from '../../models/state/state.service';
import { StateInterface } from '../../models/state/state.interface';
import { NewConnectedDevice, ConnectedDevice } from '../../interfaces/connected-device.interface';
import { DeviceUtil } from '../../utilities/device-utility';

@Injectable({
    providedIn: 'root',
})

export class TympanService {
    devices: DevicesInterface;
    state: StateInterface

    constructor(
        private tympanWrap: TympanWrap, 
        private devicesModel: DevicesModel,
        private stateModel: StateModel,
        private logger: Logger,
        private deviceUtil: DeviceUtil
    ) {
        this.devices = this.devicesModel.getDevices();
        this.state = this.stateModel.getState();
    }

    onDisconnect(deviceId:string): void {
        this.logger.debug(`device ${deviceId} disconnected`);
        this.deviceUtil.updateDeviceState(deviceId,TympanState.Disconnected);
    }

    async startScan() {
        let timeout = 30000;
        await this.tympanWrap.startScanning(this.devicesModel.availableDevicesSubject,timeout);
    }

    async stopScan() {
        await this.tympanWrap.stopScanning();
    }

    async connect(tympan:BleDevice, newConnectedDevice:NewConnectedDevice) {
        await this.tympanWrap.stopScanning();
            
        this.logger.debug("attempting to connect to tympan : "+JSON.stringify(tympan));
        try {
            await this.tympanWrap.connect(tympan.deviceId,this.onDisconnect.bind(this));

            let newConnection = newConnectedDevice;
            // TODO: could all of the below happen in createDeviceConnection()? Or at least parts?
            newConnection["deviceId"] = tympan.deviceId;
            newConnection["name"] = tympan.name;
            newConnection["state"] = TympanState.Connected; 
            newConnection["msgId"] = 0;

            let connection: ConnectedDevice = this.deviceUtil.createDeviceConnection(newConnection);
            this.devices.connectedDevices.tympan.push(connection);
            this.state.isPaneOpen.tympans = true;
        } catch {
            this.logger.error("failed to connect to tympan: "+JSON.stringify(tympan));
        }      
    }

    async reconnect(tympanId:string | undefined) {
        // TODO: This return is only needed for typing, it can likely be improved
        if (!tympanId) {
            this.logger.debug("failed to reconnect to tympan: "+JSON.stringify(tympanId));
            return
        }

        try {
            await this.tympanWrap.reconnect(tympanId,this.onDisconnect.bind(this));
            this.deviceUtil.updateDeviceState(tympanId,TympanState.Connected);
        } catch {
            this.logger.error("failed to reconnect to tympan: "+JSON.stringify(tympanId));
        }
    }

    async disconnect(tympanId:string | undefined) {
        // TODO: This return is only needed for typing, it can likely be improved
        if (!tympanId) {
            this.logger.debug("failed to disconnect to tympan: "+JSON.stringify(tympanId));
            return
        }

        await this.tympanWrap.disconnect(tympanId);
    }

    async requestId(tympanId:string,msgId:string) {
        let msg = "["+msgId+",'requestId']";
        try {
            await this.tympanWrap.write(tympanId,msg);
        } catch {
            this.logger.error("failed to write to tympan with msg: "+JSON.stringify(msg));
        }
    }

}



