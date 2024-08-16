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
    
    ADAFRUIT_SERVICE_UUID = "BC2F4CC6-AAEF-4351-9034-D66268E328F0";
    ADAFRUIT_CHARACTERISTIC_UUID = "06D1E5E7-79AD-4A71-8FAA-373789F7D93C";
    CRC8_TABLE = this.genCRC8Table();  

    constructor(public stateModel: StateModel, @Inject(WINDOW) private window: Window, private logger: Logger) {
        this.state = this.stateModel.getState();
        this.initialize();
    }

    // Useful links
    // https://code.crearecomputing.com/hearingproducts/open-hearing-group/open-hearing-firmware/-/wikis/TabSINT-%E2%86%94-Tympan-Communication-Protocol?redirected_from=TabSINT-%3C-%3E-Tympan-Communication-Protocol
    // @capacitor-community/bluetooth-le ----> https://www.npmjs.com/package/@capacitor-community/bluetooth-le/v/0.5.1


    /* needed functions
    1) listOfTympanIDs = Scan()
    2) resp = write(id)
    3) connect(id)
    4) disconnect(id)

    helper functions
    1) checksum
    2) escaping
    3) 

    */

    async initialize() {
        try {
            await BleClient.initialize();
            this.state.bluetoothConnected = true;
        } catch {
            this.state.bluetoothConnected = false;
        }
        // For debugging lets add all the functions to the window. This should eventually be removed.
        (this.window as any).tympan = {};
        (this.window as any).tympan.scan = this.scan;
        (this.window as any).tympan.connect = this.connect;
        (this.window as any).tympan.write = this.write;
        (this.window as any).msgToDataView = this.msgToDataView;
        (this.window as any).genCRC8Checksum = this.genCRC8Checksum;
        (this.window as any).handleEscaping = this.handleEscaping;
        (this.window as any).CRC8_TABLE = this.CRC8_TABLE;
        (this.window as any).ADAFRUIT_SERVICE_UUID = this.ADAFRUIT_SERVICE_UUID;
        (this.window as any).ADAFRUIT_CHARACTERISTIC_UUID = this.ADAFRUIT_CHARACTERISTIC_UUID;
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
        // let msg_to_write = this.msgToDataView(msg);
        let msg_to_write = (window as any).msgToDataView(msg);
        // let resp = await BleClient.write(device.deviceId, this.ADAFRUIT_SERVICE_UUID, this.ADAFRUIT_CHARACTERISTIC_UUID, msg_to_write);
        
        console.log("msg_to_write",msg_to_write);
        
        let resp = await BleClient.write(device.deviceId, (window as any).ADAFRUIT_SERVICE_UUID, (window as any).ADAFRUIT_CHARACTERISTIC_UUID, msg_to_write);
        this.logger.debug("resp from writing: "+msg_to_write+" is: "+JSON.stringify(resp));
    }

    async connect(device:BleDevice) {
        await BleClient.connect(device.deviceId, (deviceId:string) => this.onDisconnect(deviceId));
        console.log('connected to device', device);
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
        // let crc = this.genCRC8Checksum(buf);
        let crc = (window as any).genCRC8Checksum(buf);
        console.log("crc",crc);
        // let msgToSend = new Uint8Array([...start_byte, ...this.handleEscaping(buf), ...this.handleEscaping(crc), ...end_byte])
        let msgToSend = new Uint8Array([...start_byte, ...(window as any).handleEscaping(buf), ...(window as any).handleEscaping(crc), ...end_byte])
        console.log("number array",Array.from(msgToSend));
        return numbersToDataView(Array.from(msgToSend))
        // return new DataView(msgToSend.buffer, 0, msgToSend.length)
    }

    dataViewToString(dv:DataView): string {
        // needs to be updated
        return new TextDecoder().decode(dv.buffer)
    }




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

    genCRC8Checksum(byte_array:Uint8Array) {
        var c:any;
        for (var i = 0; i < byte_array.length; i++ ) {
            // c = this.CRC8_TABLE[(c ^ byte_array[i]) % 256];
            c = (window as any).CRC8_TABLE[(c ^ byte_array[i]) % 256];
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



