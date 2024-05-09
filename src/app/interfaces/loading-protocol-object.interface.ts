import { ProtocolMetaInterface } from "../models/protocol/protocol-meta.interface";
import { ProtocolInterface } from "../models/protocol/protocol.interface";

export interface LoadingProtocolInterface {
    protocol: ProtocolInterface;
    calibration?: any;
    meta: ProtocolMetaInterface;
    notify: Boolean;
    requiresValidation: Boolean;
    overwrite: Boolean;
}