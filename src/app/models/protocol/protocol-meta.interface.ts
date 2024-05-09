import { ProtocolErrorInterface } from "../../interfaces/protocol-error.interface";
import { ProtocolSchemaInterface } from "../../interfaces/protocol-schema.interface";
import { ProtocolServer } from "../../utilities/constants";

export interface ProtocolMetaInterface {
    group: string;
    name: string;
    path: string;
    date: string;
    version: string;
    creator: string;
    server: ProtocolServer;
    admin: boolean;
    contentURI: string;
}