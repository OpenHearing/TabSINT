import { Injectable } from '@angular/core';
import { ProtocolInterface } from './protocol.interface';
import { ProtocolServer } from '../../utilities/constants';

@Injectable({
    providedIn: 'root',
})

export class ProtocolModel {

    protocolModel: ProtocolInterface = {
        admin: false,
        server: ProtocolServer.LocalServer
    }

    getProtocol(): ProtocolInterface {
        return this.protocolModel;
    }

    isActive(p: ProtocolInterface) {
        // need to update this function
        return true;
    }
}