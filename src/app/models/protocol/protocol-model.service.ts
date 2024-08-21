import { Injectable } from '@angular/core';
import _ from 'lodash';

import { ProtocolInterface, ProtocolMetaInterface } from './protocol.interface';
import { ProtocolServer } from '../../utilities/constants';
import { ProtocolModelInterface } from './protocol.interface';
import { PageInterfaceDefaults, partialMetaDefaults } from '../../utilities/defaults';
import { DiskInterface } from '../disk/disk.interface';
import { DiskModel } from '../disk/disk.service';
import { ProtocolSchemaInterface } from '../../interfaces/protocol-schema.interface';
import { FileService } from '../../utilities/file.service';
import { error } from 'console';

@Injectable({
    providedIn: 'root',
})

export class ProtocolModel {

    disk:DiskInterface

    constructor(public diskModel:DiskModel,private fileService:FileService){
        this.disk = this.diskModel.getDisk()
    }

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
        let availableMetaProtocols = this.diskModel.disk.availableProtocolsMeta
        let loadedProtocols = this.protocolModel.loadedProtocols
        availableMetaProtocols.forEach((metaProtocol:ProtocolMetaInterface) => {
            this.fileService.readFile("protocol.json",metaProtocol.contentURI)
                .then(res => {
                    let content = res?.content
                    const parsedResult: ProtocolSchemaInterface = JSON.parse(content!);
                    const newProtocol: ProtocolInterface = { ...metaProtocol, ...parsedResult };
                    loadedProtocols[metaProtocol.name] = newProtocol;
                })
                .catch(error => {
                    console.error("Failed with:", error);
                });
        });
        this.protocolModel.loadedProtocols = loadedProtocols
        this.disk = this.diskModel.getDisk()
        return this.protocolModel;
    }
}
