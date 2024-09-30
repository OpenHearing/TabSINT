import { TympanState } from "../utilities/constants";

export interface ConnectedTympan {
    deviceId: string;
    name: string;
    state: TympanState;
}