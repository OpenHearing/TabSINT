import { ProtocolMetaInterface, ProtocolInterface } from "../models/protocol/protocol.interface";
import { ProtocolErrorInterface } from "./protocol-error.interface";
import { CalibrationInterface } from "./protocol-schema.interface";

export interface LoadingProtocolInterface {
    protocol: ProtocolInterface;
    calibration?: CalibrationInterface;
    meta: ProtocolMetaInterface;
    notify: boolean;
    requiresValidation: boolean;
    overwrite: boolean;
    errors?: Array<ProtocolErrorInterface>;
}