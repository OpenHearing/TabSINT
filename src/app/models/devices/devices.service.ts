import { Injectable } from '@angular/core';
import { DevicesModel } from './devices.interface';

@Injectable({
    providedIn: 'root',
})

export class DevicesM {

    devicesM: DevicesModel = {
        name: "name"
    }

}