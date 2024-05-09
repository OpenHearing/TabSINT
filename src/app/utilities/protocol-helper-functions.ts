import _ from "lodash";
import { ProtocolInterface } from "../models/protocol/protocol.interface";
import { ProtocolMetaInterface } from "../models/protocol/protocol-meta.interface";
import { DiskModel } from "../models/disk/disk.service";
import { Logger } from "./logger.service";

export function findDuplicateProtocols(p: ProtocolInterface, loadedP: ProtocolInterface[]) {
    return _.filter(loadedP, {
        name: p.name,
        path: p.path,
        date: p.date,
        contentURI: p.contentURI
    });
}

export function getProtocolMetaData(protocol: ProtocolInterface): ProtocolMetaInterface {
    return {
        group: protocol.group,
        name: protocol.name,
        path: protocol.path,
        date: protocol.date,
        version: protocol.version,
        creator: protocol.creator,
        server: protocol.server,
        admin: protocol.admin,
        contentURI: protocol.contentURI
    }
}
