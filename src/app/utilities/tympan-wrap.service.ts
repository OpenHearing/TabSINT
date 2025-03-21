import { Injectable, Inject } from '@angular/core';
import { Logger } from './logger.service';
import { BleClient } from '@capacitor-community/bluetooth-le';
import { BleDevice } from '../interfaces/bluetooth.interface';
import { StateInterface } from '../models/state/state.interface';
import { StateModel } from '../models/state/state.service';
import { WINDOW } from './window';
import { BehaviorSubject } from 'rxjs';
import { DevicesModel } from '../models/devices/devices-model.service';
import { DeviceUtil } from './device-utility';

@Injectable({
    providedIn: 'root',
})

export class TympanWrap {
    state: StateInterface;
    scanning: boolean = false;    
    continuousScan: boolean = false;    
    ADAFRUIT_SERVICE_UUID = "BC2F4CC6-AAEF-4351-9034-D66268E328F0"; // custom tympan service
    ADAFRUIT_CHARACTERISTIC_UUID = "06D1E5E7-79AD-4A71-8FAA-373789F7D93C"; // custom tympan characteristic
    CRC8_TABLE = this.genCRC8Table();
    TMP_BUFFER: {[key: string]: DataView} = {};
    

    constructor(
        private readonly stateModel: StateModel, 
        @Inject(WINDOW) private readonly window: Window, 
        private readonly logger: Logger,
        private readonly devicesModel: DevicesModel,
        private readonly deviceUtil: DeviceUtil
    ) {
        this.state = this.stateModel.getState();
        // TODO: Move this to generic utility for running async functions in constructor
        setTimeout(async () => {
            await this.initialize();
        }, 0);
    }

    async initialize() {
        this.logger.debug("Initializing BLE...");
        try {
            await BleClient.initialize();
            this.state.bluetoothConnected = true;
        } catch {
            this.state.bluetoothConnected = false;
        }
    }

    async stopScanning() {
        await BleClient.stopLEScan();
        this.continuousScan = false;
    }

    async startScanning(subject: BehaviorSubject<BleDevice[]>, timeout: number=5000): Promise<void> {
        this.continuousScan = true;
        if (this.scanning) {
            return
        }

        try {
            this.logger.debug("starting BLE scan");
            await this.scan(subject, timeout);
        } catch (error) {
            this.logger.error("Error starting BLE scan: "+JSON.stringify(error));
            this.scanning = false;
            this.continuousScan = false;
        }
    }

    async scan(subject: BehaviorSubject<BleDevice[]>, timeout:number=5000) {
        subject.next([]);
        this.scanning = true;
        let results: BleDevice[] = []
        await BleClient.requestLEScan({services: [this.ADAFRUIT_SERVICE_UUID],}, (result:any) => {
            this.logger.debug("found device: "+JSON.stringify(result.device));
            if (!results.includes(result.device)) {
                results.push(result.device);
            }
            subject.next(results);
        });
        
        setTimeout(async () => {
            await BleClient.stopLEScan();
            this.scanning = false;
            if (this.continuousScan) {
                this.scan(subject,timeout);
            }
        }, timeout);
    }

    async write(deviceId: string, msg: string) {
        this.clearTMPBuffer(deviceId);
        let msg_to_write = this.msgToDataView(msg);
        this.logger.debug("TIME - about to write bytes to tympan" + String(Date.now()));
        this.logger.debug("Writing "+JSON.stringify(msg)+" to tympan with ID: "+deviceId);
        await BleClient.write(deviceId, this.ADAFRUIT_SERVICE_UUID, this.ADAFRUIT_CHARACTERISTIC_UUID, msg_to_write);
    }

      
    async connect(deviceId: string, onDisconnect: Function) {
        await BleClient.connect(deviceId, (deviceId: string) => onDisconnect(deviceId));
        this.clearTMPBuffer(deviceId);
        await BleClient.startNotifications(deviceId, this.ADAFRUIT_SERVICE_UUID, this.ADAFRUIT_CHARACTERISTIC_UUID,(dv:DataView) => {
            this.handleIncomingBytes(deviceId, dv);
        });
        this.logger.debug('connected to device:'+JSON.stringify(deviceId));
    }

    async disconnect(deviceId: string) {
        await BleClient.disconnect(deviceId);
        this.logger.debug('disconnected from device:'+JSON.stringify(deviceId));
    }

    handleIncomingBytes(deviceId: string, dv: DataView) {     
        let byteArray = new Uint8Array(dv.buffer.slice(dv.byteOffset, dv.byteOffset + dv.byteLength));

        if (!this.isUnhandledByteMessage(byteArray)) {
            this.TMP_BUFFER[deviceId] = this.appendDataView(this.TMP_BUFFER[deviceId],dv);
        } else {
            this.logger.debug(`Unhandled byte sequence detected and ignored: ${this.formatHexArray(byteArray)}`);        
        }

        let tabsintId: string|undefined = this.deviceUtil.getTabsintIdFromDeviceId(deviceId);
        let msg = this.checkForCompleteMsg(deviceId);
        
        if (tabsintId && msg) {
            this.devicesModel.tympanResponseSubject.next({"tabsintId":tabsintId,"msg":msg});
        }
    }

    /*
        Byte parsing and DataView handling functions
    */

    private formatHexArray(byteArray: Uint8Array): string {
        const hexArray: string[] = Array.from(byteArray, (byte) => `0x${byte.toString(16).padStart(2, '0').toUpperCase()}`);
        return `[${hexArray.join(', ')}]`;
    }
    
    private msgToDataView(str: string): DataView {
        let start_byte = new Uint8Array([5]);
        let end_byte = new Uint8Array([2]);
        let buf = new TextEncoder().encode(str); // this is a uint8array!
        let crc = this.genCRC8Checksum(buf);
        let msgToSend = new Uint8Array([...start_byte, ...this.handleEscaping(buf), ...this.handleEscaping(crc), ...end_byte])
        return new DataView(msgToSend.buffer)
    }

    private isUnhandledByteMessage(byteArray: Uint8Array): boolean {
        const unhandledSequences = [
            [0x55, 0x6E, 0x68, 0x61, 0x6E, 0x64, 0x6C, 0x65, 0x64, 0x20, 0x62, 0x79, 0x74, 0x65, 0x20, 0x72, 0x65, 0x63], // "Unhandled byte rec"
            [0x65, 0x69, 0x76, 0x65, 0x64, 0x3A, 0x20, 0x27, 0x5C, 0x78, 0x61, 0x27], // "eived: '\xa'"
            [0x0A] // Single newline byte
        ];
    
        return unhandledSequences.some(seq => this.arrayEquals(byteArray, seq));
    }
    
    private arrayEquals(a: Uint8Array, b: number[]): boolean {
        return a.length === b.length && a.every((val, index) => val === b[index]);
    }

    private checkForCompleteMsg(deviceId: string): string|undefined {
        let dv = this.TMP_BUFFER[deviceId];
        let msg: string|undefined;
        if (dv.byteLength>0 && dv.getUint8(0)==5 && dv.getUint8(dv.buffer.byteLength-1)==2) {
            let tmp = new Uint8Array(dv.buffer.slice(0));
            let unescapedArray = this.handleUnescaping(tmp.slice(1,tmp.byteLength-1));
            let crc = unescapedArray.slice(unescapedArray.byteLength-1);
            let expectedChecksum = this.genCRC8Checksum(unescapedArray.slice(0,unescapedArray.byteLength-1));
            if (crc[0]==expectedChecksum[0]) {
                let tmpDV = new DataView(unescapedArray.slice(0,unescapedArray.byteLength-1).buffer);
                msg = this.dataViewToString(tmpDV);
            } else {
                msg = "invalid checksum";
            }
            this.logger.debug("TIME - msg parsed and checksum verified" + String(Date.now()));
            this.clearTMPBuffer(deviceId);
        }
        return msg
    }

    private clearTMPBuffer(deviceId: string) {
        this.TMP_BUFFER[deviceId] = new DataView(new ArrayBuffer(0));
    }

    private dataViewToString(dv: DataView): string {
        return new TextDecoder().decode(dv.buffer)
    }

    private appendDataView(dv1: DataView, dv2: DataView): DataView {
        let tmp = new Uint8Array(dv1.buffer.byteLength + dv2.buffer.byteLength);
        tmp.set(new Uint8Array(dv1.buffer), 0);
        tmp.set(new Uint8Array(dv2.buffer), dv1.buffer.byteLength);
        return new DataView(tmp.buffer);
    };

    private handleEscaping(byte_array: Uint8Array) {
        let escaped_byte_array: Uint8Array = new Uint8Array();
        byte_array.forEach( (byte) => {
            if (byte<=31) {
                escaped_byte_array = new Uint8Array([...escaped_byte_array, ...[3, 128 ^ byte]]);
            } else {
                escaped_byte_array = new Uint8Array([...escaped_byte_array, ...[byte]]);
            }
        });
        return escaped_byte_array
    }

    private handleUnescaping(byte_array: Uint8Array) {
        let unescaped_byte_array: Uint8Array = new Uint8Array();
        let esc_next: boolean = false;
        byte_array.forEach( (byte:any) => {
            if (!esc_next) {
                if (byte==3) {
                    esc_next = true;
                } else {
                    unescaped_byte_array = new Uint8Array([...unescaped_byte_array, ...[byte]]);
                }  
            } else {
                unescaped_byte_array = new Uint8Array([...unescaped_byte_array, ...[byte ^ 128]]);
                esc_next = false;
            }
        });
        return unescaped_byte_array
    }

    private genCRC8Checksum(byte_array: Uint8Array) {
        let c: any;
        byte_array.forEach( (byte) => {
            c = this.CRC8_TABLE[(c ^ byte) % 256];
        });
        return new Uint8Array([c]);
    } 

    private genCRC8Table() {
        let csTable = [] // 256 max len byte array
        for ( let i = 0; i < 256; ++i ) {
            let curr = i
            for (let j = 0; j < 8; ++j) {
                if ((curr & 0x80) !== 0) {
                    curr = ((curr << 1) ^ 0x07) % 256
                } else {
                    curr = (curr << 1) % 256
                }
            }
            csTable[i] = curr 
        }
        return csTable
    }
    
}



