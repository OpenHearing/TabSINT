import { TympanState } from "../utilities/constants";

export interface ConnectedTympan {
    id: string;
    name: string;
    state: TympanState;
}