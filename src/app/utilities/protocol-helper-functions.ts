import _ from "lodash";
import { ProtocolMetaInterface, ProtocolInterface } from "../models/protocol/protocol.interface";

export function findDuplicateProtocols(p: ProtocolInterface, loadedP: ProtocolInterface[]) {
    return _.filter(loadedP, {
        name: p.name,
        path: p.path,
        date: p.date,
        contentURI: p.contentURI
    });
}

export function getProtocolMetaData(protocol: ProtocolMetaInterface): ProtocolMetaInterface {
    return {
        group: protocol.group,
        name: protocol.name,
        path: protocol.path,
        date: protocol.date,
        version: protocol.version,
        creator: protocol.creator,
        server: protocol.server,
        admin: protocol.admin,
        contentURI: protocol.contentURI,
        gitlabConfig: protocol.gitlabConfig
    }
}
