import { ProtocolMetaInterface } from "../models/protocol/protocol.interface";
import { ProtocolInterface } from "../models/protocol/protocol.interface";

export interface LoadingProtocolInterface {
    protocol: ProtocolInterface;
    calibration?: any;
    meta: ProtocolMetaInterface;
    notify: boolean;
    requiresValidation: boolean;
    overwrite: boolean;
}