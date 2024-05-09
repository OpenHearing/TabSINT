import { LoadingProtocolInterface } from "../interfaces/loading-protocol-object.interface";
import { ProtocolSchemaInterface } from "../interfaces/protocol-schema.interface";
import { ProtocolMetaInterface } from "../models/protocol/protocol-meta.interface";
import { ProtocolInterface } from "../models/protocol/protocol.interface";
import { ProtocolServer } from "./constants";

export const metaDefaults: ProtocolMetaInterface = {
    group: '',
    name: '',
    path: '',
    date: '',
    version: '',
    creator: '',
    server: ProtocolServer.LocalServer,
    admin: false,
    contentURI: ''
};

export const partialMetaDefaults = {
    id: '',
    group: '',
    name: '',
    date: '',
    version: '',
    contentURI: ''
};

const protocolDefaults: ProtocolInterface = {
    ...metaDefaults,
    type: "ProtocolSchemaInterface",
    id: '',
    protocolId: '',
    pages: []
};

export function loadingProtocolDefaults(_requiresValidation: boolean = true): LoadingProtocolInterface {
    let loadingProtocol: LoadingProtocolInterface = {
        protocol: protocolDefaults,
        calibration: undefined,
        requiresValidation: _requiresValidation,
        meta: metaDefaults,
        overwrite: false,
        notify: false
    }

    return loadingProtocol;
};