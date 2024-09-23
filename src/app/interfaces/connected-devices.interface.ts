import { List } from "lodash";
import { ConnectedTympan } from "./connected.tympan.interface";

export interface ConnectedDevices {
    tympan: List<ConnectedTympan>;
    cha: List<Object>;
    svantek: List<Object>;
}