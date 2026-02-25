import { PageDefinition, ProtocolReferenceInterface } from '../interfaces/page-definition.interface';
import { ProtocolSchemaInterface } from '../interfaces/protocol-schema.interface';
import { PageInterface } from '../models/page/page.interface';
import { ProtocolStackItem } from '../models/protocol/protocol-stack';
import { PageTypes } from '../types/custom-types';

export function isProtocolStarted(item?: ProtocolStackItem): item is ProtocolStackItem {
  return item !== undefined && item.pageQueue.length > 0 && item.pageIndex >= 0 && item.pageIndex < item.pageQueue.length;
}

export function isProtocolSchemaInterface(page: PageTypes): page is ProtocolSchemaInterface {
  return (page as ProtocolSchemaInterface).pages !== undefined;
}

export function isPageDefinition(page: PageTypes): page is PageDefinition {
  return (page as ProtocolReferenceInterface).reference === undefined && (page as PageDefinition).id !== undefined;
}

export function isProtocolReferenceInterface(page: PageTypes): page is ProtocolReferenceInterface {
  return (page as ProtocolReferenceInterface).reference !== undefined;
}

export function isManualAudiometryResponseArea(page: PageInterface): boolean {
  return page?.responseArea?.type === 'manualAudiometryResponseArea';
}
