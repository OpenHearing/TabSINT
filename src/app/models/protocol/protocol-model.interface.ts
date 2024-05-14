import { FollowOnsDictionary } from "../../interfaces/follow-ons-dictionary";
import { ProtocolDictionary } from "../../interfaces/protocol-dictionary";
import { ProtocolSchemaInterface } from "../../interfaces/protocol-schema.interface";
import { ProtocolInterface } from "./protocol.interface";

export interface ProtocolModelInterface {
    activeProtocol?: ProtocolInterface, 
    activeProtocolDictionary?: ProtocolDictionary,
    activeProtocolFollowOnsDictionary?: FollowOnsDictionary,
    loadedProtocols: Array<ProtocolInterface>, 
}