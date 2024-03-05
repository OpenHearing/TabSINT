import { Injectable } from '@angular/core';
import { ProtocolModel } from './protocol.interface';
import { ProtocolServer } from '../../utilities/constants';

@Injectable({
    providedIn: 'root',
})

export class ProtocolM {

    protocolM: ProtocolModel = {
        admin: false,
        server: ProtocolServer.LocalServer
    }

}