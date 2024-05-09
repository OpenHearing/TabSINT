import { PageDefinition, ProtocolReference } from "../interfaces/page-definition.interface";
import { ProtocolSchemaInterface } from "../interfaces/protocol-schema.interface";

export function getIdBasedOnTargetType(target: PageDefinition | ProtocolReference | ProtocolSchemaInterface): string {
    let id: string = target.type === "ProtocolReference"
            ? (target as ProtocolReference).reference
            : target.type === "ProtocolSchemaInterface"
                ? (target as ProtocolSchemaInterface).protocolId
                : (target as PageDefinition).id;

    return id;
}
