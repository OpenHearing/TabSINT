import { ConnectedTympan } from "./connected-tympan.interface";

export interface ConnectedDevices {
    tympan: Array<ConnectedTympan>;
    cha: Array<Object>;
    svantek: Array<Object>;
}