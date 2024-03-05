import { Injectable } from '@angular/core';
import { ProtocolModel } from './protocol.interface';

@Injectable({
    providedIn: 'root',
})

export class ProtocolM {

    protocolM: ProtocolModel = {
        admin: false
    }

}