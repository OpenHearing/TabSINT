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
            "audiometry": {
                ...partialMetaDefaults,
                name: "Audiometry",
                path: "protocols/edare-audiometry",
                creator: "Edare"
            },
            "Creare Audiometry": {
                ...partialMetaDefaults,
                name: "Creare Audiometry",
                path: "protocols/creare-audiometry",
                creator: "Creare"
            },
            "tabsint-test": {
                ...partialMetaDefaults,
                name: "tabsint-test",
                path: "protocols/TabSINT-Test",
                creator: "Creare"
            },
            "wahts-device-test": {
                ...partialMetaDefaults,
                name: "wahts-device-test",
                path: "protocols/wahts-device-test",
                creator: "Creare"
            },
            "wahts-software-test": {
                ...partialMetaDefaults,
                name: "wahts-software-test",
                path: "protocols/wahts-software-test",
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
