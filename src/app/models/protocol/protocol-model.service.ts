import { Injectable } from '@angular/core';
import _ from 'lodash';

import { ProtocolModelInterface } from './protocol.interface';
import { partialMetaDefaults } from '../../utilities/defaults';

@Injectable({
    providedIn: 'root',
})

export class ProtocolModel {

    protocolModel: ProtocolModelInterface = {
        activeProtocol: undefined,
        loadedProtocols: {
            "Creare Audiometry": {
                ...partialMetaDefaults,
                name: "Creare Audiometry",
                path: "protocols/creare-audiometry",
                creator: "Creare"
            },
            "develop": {
                ...partialMetaDefaults,
                name: "develop",
                path: "protocols/develop",
                creator: "Creare"
            }
        }
    }

    getProtocolModel(): ProtocolModelInterface {
        return this.protocolModel;
    }
}
