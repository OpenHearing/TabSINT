import { ConnectedTympan } from "./connected-tympan.interface";

export interface ConnectedDevice extends ConnectedTympan {
    type: string;
    tabsintId: string;
}

export interface NewConnectedDevice extends Partial<ConnectedTympan> {
    type: string;
    tabsintId?: string;
}