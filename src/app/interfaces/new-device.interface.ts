import { ConnectedTympan } from "./connected-tympan.interface";

export interface ConnectedDevice extends Partial<ConnectedTympan> {
    type: string;
    tabsintId?: string;
}