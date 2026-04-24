import { IDeviceResponse } from '../interfaces/devices/device-response.interface';
import { RequestIdResponse } from '../interfaces/devices/device-responses.interface';
import { PageDefinition, ProtocolReferenceInterface, ResponseArea } from '../interfaces/page-definition.interface';
import { ProtocolSchemaInterface } from '../interfaces/protocol-schema.interface';
import { PageInterface } from '../models/page/page.interface';
import { ProtocolStackItem } from '../models/protocol/protocol-stack';
import { PageTypes } from '../types/custom-types';
import { ButtonGridInterface } from '../views/response-area/response-areas/button-grid/button-grid.interface';
import { CheckboxInterface } from '../views/response-area/response-areas/checkbox/checkbox.interface';
import { MultipleChoiceInterface } from '../views/response-area/response-areas/multiple-choice/multiple-choice.interface';

export function isChoiceResponseArea(responseArea?: ResponseArea): responseArea is ButtonGridInterface | MultipleChoiceInterface | CheckboxInterface {
  return (responseArea as CheckboxInterface)?.choices !== undefined;
}

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

export function isValidDeviceResponse(response?: IDeviceResponse): response is IDeviceResponse {
  return response?.msg !== undefined && Array.isArray(response?.msg) && !response.msg.includes('ERROR') && !response.msg.includes('error');
}

export function isRequestIdResponse(response?: IDeviceResponse): response is RequestIdResponse {
  return (
    isValidDeviceResponse(response) &&
    response.msg.length >= 2 &&
    (response as RequestIdResponse).msg[1].serialNumber !== undefined &&
    (response as RequestIdResponse).msg[1].buildDateTime !== undefined
  );
}
