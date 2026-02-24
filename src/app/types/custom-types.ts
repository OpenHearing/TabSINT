import { IDeviceResponse } from '../interfaces/devices/device-response.interface';
import { PageInterface, ProtocolReferenceInterface } from '../interfaces/page-definition.interface';
import { ProtocolSchemaInterface } from '../interfaces/protocol-schema.interface';

export type PageTypes = PageInterface | ProtocolReferenceInterface | ProtocolSchemaInterface;

export interface Command {
  func: () => Promise<IDeviceResponse>;
  name: string;
}
