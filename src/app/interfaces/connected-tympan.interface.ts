import { DeviceState } from "../utilities/constants";

export interface ConnectedTympan {
    deviceId: string;
    name: string;
    state: DeviceState;
    msgId: number;
}