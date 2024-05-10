import { Injectable } from '@angular/core';
import _ from 'lodash';

import { ProtocolInterface } from './protocol.interface';
import { ProtocolServer } from '../../utilities/constants';
import { ProtocolModelInterface } from './protocol-model.interface';
import { partialMetaDefaults } from '../../utilities/defaults';

@Injectable({
    providedIn: 'root',
})

export class ProtocolModel {

    protocolModel: ProtocolModelInterface = {
        activeProtocol: undefined,
        loadedProtocols: [
            this.define({
                ...partialMetaDefaults,
                protocolId: "",
                name: "Audiometry",
                path: "protocols/edare-audiometry",
                creator: "Edare",
                server: ProtocolServer.Developer,
                admin: false
            }),
            this.define({
                ...partialMetaDefaults,
                protocolId: "",
                name: "Creare Audiometry",
                path: "protocols/creare-audiometry",
                creator: "creare",
                server: ProtocolServer.Developer,
                admin: true
            }),
            this.define({
                ...partialMetaDefaults,
                protocolId: "",
                name: "tabsint-test",
                path: "protocols/TabSINT-Test",
                creator: "creare",
                server: ProtocolServer.Developer,
                admin: true
            }),
            this.define({
                ...partialMetaDefaults,
                protocolId: "",
                name: "wahts-device-test",
                path: "protocols/wahts-device-test",
                creator: "creare",
                server: ProtocolServer.Developer,
                admin: true
            }),
            this.define({
                ...partialMetaDefaults,
                protocolId: "",
                name: "wahts-software-test",
                path: "protocols/wahts-software-test",
                creator: "creare",
                server: ProtocolServer.Developer,
                admin: true
            }),
            this.define({
                ...partialMetaDefaults,
                protocolId: "",
                name: "develop",
                path: "protocols/develop",
                creator: "creare",
                server: ProtocolServer.Developer,
                admin: true
            })
        ]
    }

    getProtocolModel(): ProtocolModelInterface {
        return this.protocolModel;
    }
        

    define(obj: ProtocolInterface): ProtocolInterface {

        // if (obj.server === ProtocolServer.Developer) {
        //     obj.version = version.dm.tabsint;
        // }
    
        return _.defaults(
            {
                group: obj.group || null,
                name: obj.name,
                path: obj.path,
                id: obj.id || null,
                date: obj.date || null,
                version: obj.version || null,
                creator: obj.creator || null,
                server: obj.server || null,
                admin: obj.admin || false,
                contentURI: obj.contentURI || null
            },
            obj
        );
    };

}