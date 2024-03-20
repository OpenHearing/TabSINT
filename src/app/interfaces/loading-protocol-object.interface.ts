import { ProtocolInterface } from "../models/protocol/protocol.interface";
import { ProtocolSchema } from "./protocol-schema.interface";

export interface LoadingProtocolInterface {
    protocol: ProtocolInterface;
    calibration?: any;
    meta: ProtocolInterface;
    notify: Boolean;
    requiresValidation: Boolean;
    reload: Boolean;
}