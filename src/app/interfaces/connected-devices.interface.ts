import { ConnectedDevice } from "./new-device.interface";

export interface ConnectedDevices {
    tympan: Array<ConnectedDevice>;
    cha: Array<Object>;
    svantek: Array<Object>;
}