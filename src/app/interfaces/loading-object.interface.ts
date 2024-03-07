import { ProtocolModel } from "../models/protocol/protocol.interface";

export interface LoadingProtocolObject {
    protocol?: string;
    calibration?: string;
    meta?: ProtocolModel;
    notify: Boolean;
    validate: Boolean;
    reload: Boolean;
}