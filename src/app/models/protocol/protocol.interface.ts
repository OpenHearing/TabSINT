import { ProtocolServer } from "../../utilities/constants";

export interface ProtocolInterface {
    group?: string;
    name?: string;
    path?: string;
    id?: string;
    date?: string;
    version?: string;
    creator?: string;
    server?: ProtocolServer;
    admin?: boolean;
    contentURI?: string;
}