import { PageInterface, ProtocolReferenceInterface } from '../interfaces/page-definition.interface';
import { ProtocolSchemaInterface } from '../interfaces/protocol-schema.interface';
import { PageTypes } from '../types/custom-types';

export function isProtocolSchemaInterface(page: PageTypes): page is ProtocolSchemaInterface {
  return (page as ProtocolSchemaInterface).pages !== undefined;
}

export function isPageInterface(page: PageTypes): page is PageInterface {
  return (page as ProtocolReferenceInterface).reference === undefined && (page as PageInterface).id !== undefined;
}

export function isProtocolReferenceInterface(page: PageTypes): page is ProtocolReferenceInterface {
  return (page as ProtocolReferenceInterface).reference !== undefined;
}

export function isManualAudiometryResponseArea(page: PageInterface): boolean {
  return page?.responseArea?.type === 'manualAudiometryResponseArea';
}
