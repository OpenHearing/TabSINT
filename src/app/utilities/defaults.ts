import { LoadingProtocolInterface } from "../interfaces/loading-protocol-object.interface";
import { ProtocolSchemaInterface } from "../interfaces/protocol-schema.interface";

export function loadingProtocolDefaults(_requiresValidation: boolean): LoadingProtocolInterface {

    let _protocol: ProtocolSchemaInterface = {
            type: "ProtocolSchemaInterface",
            protocolId: '',
            pages: []
        };

    let loadingProtocol: LoadingProtocolInterface = {
        protocol: _protocol,
        calibration: undefined,
        requiresValidation: _requiresValidation,
        meta: _protocol,
        reload: false,
        notify: false
    }

    return loadingProtocol;
};