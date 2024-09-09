import { PageDefinition, ProtocolReferenceInterface } from "../interfaces/page-definition.interface";
import { ProtocolSchemaInterface } from "../interfaces/protocol-schema.interface";

export function isProtocolSchemaInterface(page: PageT): page is ProtocolSchemaInterface {
    return (page as ProtocolSchemaInterface).pages !== undefined;
}

export function isPageDefinition(page: ProtocolSchemaInterface | PageDefinition | ProtocolReferenceInterface): page is PageDefinition {
    return (page as PageDefinition).id !== undefined;
}

export function isProtocolReferenceInterface(page: ProtocolSchemaInterface | PageDefinition | ProtocolReferenceInterface): page is ProtocolReferenceInterface {
    return (page as ProtocolReferenceInterface).reference !== undefined;
}