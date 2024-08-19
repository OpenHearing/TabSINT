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
            "audiometry": this.define({
                ...partialMetaDefaults,
                protocolId: "",
                name: "Audiometry",
                path: "protocols/edare-audiometry",
                creator: "Edare",
                server: ProtocolServer.Developer,
                admin: false,
                pages: PageInterfaceDefaults
            }),
            "Creare Audiometry": this.define({
                ...partialMetaDefaults,
                protocolId: "",
                name: "Creare Audiometry",
                path: "protocols/creare-audiometry",
                creator: "creare",
                server: ProtocolServer.Developer,
                admin: true,
                pages: PageInterfaceDefaults
            }),
            "tabsint-test": this.define({
                ...partialMetaDefaults,
                protocolId: "",
                name: "tabsint-test",
                path: "protocols/TabSINT-Test",
                creator: "creare",
                server: ProtocolServer.Developer,
                admin: true,
                pages: PageInterfaceDefaults
            }),
            "wahts-device-test": this.define({
                ...partialMetaDefaults,
                protocolId: "",
                name: "wahts-device-test",
                path: "protocols/wahts-device-test",
                creator: "creare",
                server: ProtocolServer.Developer,
                admin: true,
                pages: PageInterfaceDefaults
            }),
            "wahts-software-test": this.define({
                ...partialMetaDefaults,
                protocolId: "",
                name: "wahts-software-test",
                path: "protocols/wahts-software-test",
                creator: "creare",
                server: ProtocolServer.Developer,
                admin: true,
                pages: PageInterfaceDefaults
            }),
            "develop": this.define({
                ...partialMetaDefaults,
                protocolId: "",
                name: "develop",
                path: "protocols/develop",
                creator: "creare",
                server: ProtocolServer.Developer,
                admin: true,
                pages: PageInterfaceDefaults
            })
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
                    const newProtocol: ProtocolInterface = this.define({ ...metaProtocol, ...parsedResult,id:''});
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