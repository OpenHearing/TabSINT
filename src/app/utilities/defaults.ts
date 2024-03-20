import { LoadingProtocolInterface } from "../interfaces/loading-protocol-object.interface";
import { ProtocolSchema } from "../interfaces/protocol-schema.interface";

export function loadingProtocolDefaults(_requiresValidation: boolean): LoadingProtocolInterface {

    let _protocol: ProtocolSchema = {
            protocolId: '',
            pages: []
        };

    let loadingProtocol: LoadingProtocolInterface = {
        protocol: _protocol,
        calibration: undefined,
        requiresValidation: _requiresValidation,
        meta: {},
        reload: false,
        notify: false
    }

    return loadingProtocol;
};