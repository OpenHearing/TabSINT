import { ProtocolMetaInterface } from "../models/protocol/protocol.interface";
import { ActiveProtocolInterface } from "../models/protocol/protocol.interface";

export interface LoadingProtocolInterface {
    protocol: ActiveProtocolInterface;
    calibration?: any;
    meta: ProtocolMetaInterface;
    notify: boolean;
    requiresValidation: boolean;
    overwrite: boolean;
}