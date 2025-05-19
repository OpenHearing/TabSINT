import { Injectable } from '@angular/core';

import { ProtocolModelInterface } from './protocol.interface';

@Injectable({
    providedIn: 'root',
})

export class ProtocolModel {

    protocolModel: ProtocolModelInterface = {
        activeProtocol: undefined
    }

    getProtocolModel(): ProtocolModelInterface {
        return this.protocolModel;
    }
}
