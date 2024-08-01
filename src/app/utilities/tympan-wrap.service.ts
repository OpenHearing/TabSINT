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
    BLE_HEADERPACKET_PREFIX = [0xab, 0xad, 0xc0, 0xde, 0xff];
    BLE_SHORTPACKET_PREFIX_BYTE = 0xcc;
    DATASTREAM_SEPARATOR = String.fromCharCode(0x03);

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
    }

    async scan(service_uuid:string=this.ADAFRUIT_SERVICE_UUID,timeout:number=5000): Promise<BleDevice[]> {
        let results:BleDevice[] = []
        try {
            console.log("starting ble scan");
            // await BleClient.requestLEScan({services: [service_uuid],},
            await BleClient.requestLEScan({},
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
        const POLAR_PMD_SERVICE = 'fb005c80-02e7-f387-1cad-8acd2d8df0c8';
        const POLAR_PMD_CONTROL_POINT = 'fb005c81-02e7-f387-1cad-8acd2d8df0c8';
        // await BleClient.write(device.deviceId, POLAR_PMD_SERVICE, POLAR_PMD_CONTROL_POINT, numbersToDataView([1, 0]));

        // let msg_to_write = this.stringToDataView('hello world');
        let msg_to_write = this.stringToDataView(msg);
        let resp = await BleClient.write(device.deviceId, POLAR_PMD_SERVICE, POLAR_PMD_CONTROL_POINT, msg_to_write);
        this.logger.debug("resp from writing: "+msg_to_write+" is: "+JSON.stringify(resp));

        /*
        Might want to try writing something like: [1, "requestId"]
        I assume we can stringify it, ues stringToDataView(), write it, then log the response.
        */
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





    stringToDataView(str:string): DataView {
        let buf = new TextEncoder().encode(str);
        return new DataView(buf.buffer, 0, buf.length)
    }

    dataViewToString(dv:DataView): string {
        return new TextDecoder().decode(dv.buffer)
    }
    
}



