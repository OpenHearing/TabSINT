import { ProtocolInterface } from "../models/protocol/protocol.interface";

export interface LoadingProtocolInterface {
    protocol?: string;
    calibration?: string;
    meta?: ProtocolInterface;
    notify: Boolean;
    validate: Boolean;
    reload: Boolean;
}