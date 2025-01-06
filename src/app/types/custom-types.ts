import { PageDefinition, ProtocolReferenceInterface } from "../interfaces/page-definition.interface";
import { ProtocolSchemaInterface } from "../interfaces/protocol-schema.interface";

export type PageTypes = PageDefinition | ProtocolReferenceInterface | ProtocolSchemaInterface;

export type Command<T = any> = {
    func: (...args: any[]) => Promise<T>;
    params: any[];
  };
  
