import { ProtocolSchemaInterface } from "../../interfaces/protocol-schema.interface";
import { ProtocolInterface } from "./protocol.interface";

export interface ProtocolModelInterface {
    activeProtocol?: ProtocolInterface, 
    loadedProtocols: Array<ProtocolInterface>, 
}