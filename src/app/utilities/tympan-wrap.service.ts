import { Injectable } from '@angular/core';
import { Logger } from './logger.service';
import { BleClient, numberToUUID } from '@capacitor-community/bluetooth-le';

@Injectable({
    providedIn: 'root',
})

export class TympanWrap {

    ADAFRUIT_SERVICE_UUID = "BC2F4CC6-AAEF-4351-9034-D66268E328F0";
    ADAFRUIT_CHARACTERISTIC_UUID = "06D1E5E7-79AD-4A71-8FAA-373789F7D93C";
    BLE_HEADERPACKET_PREFIX = [0xab, 0xad, 0xc0, 0xde, 0xff];
    BLE_SHORTPACKET_PREFIX_BYTE = 0xcc;
    DATASTREAM_SEPARATOR = String.fromCharCode(0x03);

    constructor() {}

}



