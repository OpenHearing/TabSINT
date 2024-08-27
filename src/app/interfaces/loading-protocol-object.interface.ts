import { ProtocolMetaInterface } from "../models/protocol/protocol.interface";
import { ProtocolInterface } from "../models/protocol/protocol.interface";
import { CalibrationInterface } from "./protocol-schema.interface";

export interface LoadingProtocolInterface {
    protocol: ProtocolInterface;
    calibration?: CalibrationInterface;
    meta: ProtocolMetaInterface;
    notify: boolean;
    requiresValidation: boolean;
    overwrite: boolean;
}