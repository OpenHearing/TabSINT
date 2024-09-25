import { ConnectedTympan } from "./connected-tympan.interface";

export interface newConnectedDevice extends Partial<ConnectedTympan> {
    type: string;
}