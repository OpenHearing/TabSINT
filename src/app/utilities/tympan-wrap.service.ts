import { Injectable, Inject } from '@angular/core';
import { Logger } from './logger.service';
import { BleClient, numberToUUID, numbersToDataView } from '@capacitor-community/bluetooth-le';
import { BleDevice } from '../interfaces/bluetooth.interface';
import { StateInterface } from '../models/state/state.interface';
import { StateModel } from '../models/state/state.service';
import { WINDOW } from './window';

@Injectable({
    providedIn: 'root',
})

export class TympanWrap {

    state: StateInterface;
    
    ADAFRUIT_SERVICE_UUID = "BC2F4CC6-AAEF-4351-9034-D66268E328F0"; // custom tympan service
    ADAFRUIT_CHARACTERISTIC_UUID = "06D1E5E7-79AD-4A71-8FAA-373789F7D93C"; // custom tympan characteristic
    // ADAFRUIT_SERVICE_UUID = "6E400001-B5A3-f393-E0A9-E50E24DCCA9E"; // nord chip service
    // ADAFRUIT_CHARACTERISTIC_UUID = "6E400002-B5A3-F393-E0A9-E50E24DCCA9E"; // nord chip characteristic
    CRC8_TABLE = this.genCRC8Table();
    TMP_BUFFER = new DataView(new ArrayBuffer(0));

    constructor(public stateModel: StateModel, @Inject(WINDOW) private window: Window, private logger: Logger) {
        this.state = this.stateModel.getState();
        this.initialize();
    }

    // Useful links
    // https://code.crearecomputing.com/hearingproducts/open-hearing-group/open-hearing-firmware/-/wikis/TabSINT-%E2%86%94-Tympan-Communication-Protocol?redirected_from=TabSINT-%3C-%3E-Tympan-Communication-Protocol
    // @capacitor-community/bluetooth-le ----> https://www.npmjs.com/package/@capacitor-community/bluetooth-le/v/0.5.1

    async initialize() {
        try {
            await BleClient.initialize();
            this.state.bluetoothConnected = true;
        } catch {
            this.state.bluetoothConnected = false;
        }
    }

    async scan(service_uuid:string=this.ADAFRUIT_SERVICE_UUID,timeout:number=5000): Promise<BleDevice[]> {
        let results:BleDevice[] = []
        try {
            console.log("starting ble scan");
            await BleClient.requestLEScan({services: [service_uuid],},
                    (result:any) => {
                    results.push(result.device);
                }
            );
        
            setTimeout(async () => {
                await BleClient.stopLEScan();
                console.log('stopping ble scan');
                console.log('detected devices:',results);
            }, timeout);

        } catch (error) {
            console.error(error);
        }
        return results

    }

    async write(device:BleDevice, msg:string) {
        let msg_to_write = this.msgToDataView(msg);
        console.log("msg_to_write",msg_to_write);
        console.log("TIME",Date.now());
        
        await BleClient.startNotifications(device.deviceId, this.ADAFRUIT_SERVICE_UUID, this.ADAFRUIT_CHARACTERISTIC_UUID,(e) => {
                console.log("e.buffer",e.buffer);
            this.TMP_BUFFER = this.appendDataView(this.TMP_BUFFER,e);
            console.log("appended buffer",this.TMP_BUFFER);
            console.log(this.dataViewToMsg(this.TMP_BUFFER));
        });

        let resp = await BleClient.write(device.deviceId, this.ADAFRUIT_SERVICE_UUID, this.ADAFRUIT_CHARACTERISTIC_UUID, msg_to_write);
        this.logger.debug("resp from writing: "+msg_to_write+" is: "+JSON.stringify(resp));
    }

    async connect(device:BleDevice) {
        await BleClient.connect(device.deviceId, (deviceId:string) => this.onDisconnect(deviceId));
        console.log('connected to device', device);

        let availableServices = await BleClient.getServices(device.deviceId);
        console.log("availableServices",availableServices); // uneeded?
    }   

    onDisconnect(deviceId:string): void {
        console.log(`device ${deviceId} disconnected`);
    }

    async disconnect(device:BleDevice) {
        await BleClient.disconnect(device.deviceId);
        console.log('disconnected from device', device);
    }





    msgToDataView(str:string): DataView {
        let start_byte = new Uint8Array([5]);
        let end_byte = new Uint8Array([2]);
        let buf = new TextEncoder().encode(str); // this is a uint8array!
        let crc = this.genCRC8Checksum(buf);
        console.log("crc",crc);
        let msgToSend = new Uint8Array([...start_byte, ...this.handleEscaping(buf), ...this.handleEscaping(crc), ...end_byte])
        console.log("number array",Array.from(msgToSend));
        return numbersToDataView(Array.from(msgToSend))
    }

    dataViewToMsg(dv:DataView):string {
        var msg:string = '';
        if (dv.getUint8(0)==5 && dv.getUint8(dv.buffer.byteLength-1)==2) {
            msg='good packet';
            let tmp = new Uint8Array(dv.buffer.slice(0));
            console.log("tmp",tmp);
            let unescapedArray = this.handleUnescaping(tmp.slice(1,tmp.byteLength-1));
            console.log("unescapedArray",unescapedArray);
            console.log("crc",unescapedArray.slice(unescapedArray.byteLength-1));
            let expectedChecksum = this.genCRC8Checksum(unescapedArray.slice(0,unescapedArray.byteLength-1));
            console.log("expectedChecksum",expectedChecksum);
            let tmpDV=new DataView(unescapedArray.slice(0,unescapedArray.byteLength-1).buffer);
            let pkt = this.dataViewToString(tmpDV);
            console.log("parsed pkt",pkt);
            console.log("TIME",Date.now());
        } else {
            msg='bad packet';
        }
        return msg
    }

    dataViewToString(dv:DataView): string {
        // needs to be updated
        return new TextDecoder().decode(dv.buffer)
    }

    appendDataView(dv1:DataView, dv2:DataView):DataView {
        var tmp = new Uint8Array(dv1.buffer.byteLength + dv2.buffer.byteLength);
        tmp.set(new Uint8Array(dv1.buffer), 0);
        tmp.set(new Uint8Array(dv2.buffer), dv1.buffer.byteLength);
        return new DataView(tmp.buffer);
    };




    handleEscaping(byte_array:Uint8Array) {
        var escaped_byte_array:Uint8Array = new Uint8Array();
        byte_array.forEach( (byte) => {
            if (byte<=31) {
                escaped_byte_array = new Uint8Array([...escaped_byte_array, ...[3, 80 ^ byte]]);
            } else {
                escaped_byte_array = new Uint8Array([...escaped_byte_array, ...[byte]]);
            }
        })
        return escaped_byte_array
    }

    handleUnescaping(byte_array:Uint8Array) {
        var unescaped_byte_array:Uint8Array = new Uint8Array();
        var skipNext:boolean = false;
        byte_array.forEach( (byte:any) => {
            if (skipNext==false) {
                if (byte==3) {
                    unescaped_byte_array = new Uint8Array([...unescaped_byte_array, ...[byte ^ 80]]);
                    skipNext = true;
                } else {
                    unescaped_byte_array = new Uint8Array([...unescaped_byte_array, ...[byte]]);
                }
            } else {
                skipNext=false;
            }
        })
        return unescaped_byte_array
    }

    genCRC8Checksum(byte_array:Uint8Array) {
        var c:any;
        for (var i = 0; i < byte_array.length; i++ ) {
            c = this.CRC8_TABLE[(c ^ byte_array[i]) % 256];
        }
        return new Uint8Array([c]);
    } 

    genCRC8Table() {
        var csTable = [] // 256 max len byte array
        for ( var i = 0; i < 256; ++i ) {
            var curr = i
            for ( var j = 0; j < 8; ++j ) {
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



