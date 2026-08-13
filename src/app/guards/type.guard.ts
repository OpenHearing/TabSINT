import { IDeviceResponse } from '../interfaces/devices/device-response.interface';
import {
  DirectoryEntryResponse,
  FileOperationCompleteResponse,
  FileProgressResponse,
  GetDirectoryResponse,
  RequestIdResponse,
  RequestSettingResponse,
  StatusResponse,
  WahtsResultsResponse,
} from '../interfaces/devices/device-responses.interface';
import { PageDefinition, ProtocolReferenceInterface, ResponseArea } from '../interfaces/page-definition.interface';
import { ProtocolSchemaInterface } from '../interfaces/protocol-schema.interface';
import { PageInterface } from '../models/page/page.interface';
import { ProtocolStackItem } from '../models/protocol/protocol-stack';
import { PageTypes } from '../types/custom-types';
import { ButtonGridInterface } from '../views/response-area/response-areas/button-grid/button-grid.interface';
import { CheckboxInterface } from '../views/response-area/response-areas/checkbox/checkbox.interface';
import { GapResultsInterface } from '../views/response-area/response-areas/gap/gap.interface';
import { MultipleChoiceInterface } from '../views/response-area/response-areas/multiple-choice/multiple-choice.interface';

export function isChoiceResponseArea(responseArea?: ResponseArea): responseArea is ButtonGridInterface | MultipleChoiceInterface | CheckboxInterface {
  return (responseArea as CheckboxInterface)?.choices !== undefined;
}

export function isGapResults(value: unknown): value is GapResultsInterface {
  return typeof value === 'object' && value !== null;
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

export function isThreeDigitResponseArea(page: PageInterface): boolean {
  return page?.responseArea?.type === 'threeDigitResponseArea';
}

export function isGapResponseArea(page: PageInterface): boolean {
  return page?.responseArea?.type === 'gapResponseArea';
}

export function isHintResponseArea(page: PageInterface): boolean {
  return page?.responseArea?.type === 'hintResponseArea';
}

export function isHughsonWestlakeResponseArea(page: PageInterface): boolean {
  return page?.responseArea?.type === 'hughsonWestlakeResponseArea';
}

export function isValidDeviceResponse(response?: IDeviceResponse): response is IDeviceResponse {
  return response?.msg !== undefined && Array.isArray(response?.msg) && !response.msg.includes('ERROR') && !response.msg.includes('error');
}

export function isSuccessfulFileOperation(response?: IDeviceResponse): response is IDeviceResponse {
  return isValidDeviceResponse(response) && response?.msg.length >= 2 && (response as FileOperationCompleteResponse).msg[1].Outcome === 'success';
}

export function isRequestIdResponse(response?: IDeviceResponse): response is RequestIdResponse {
  return (
    isValidDeviceResponse(response) &&
    response.msg.length >= 2 &&
    (response as RequestIdResponse).msg[1].serialNumber !== undefined &&
    (response as RequestIdResponse).msg[1].buildDateTime !== undefined
  );
}

export function isRequestSettingResponse(response?: IDeviceResponse): response is RequestSettingResponse {
  return (
    isValidDeviceResponse(response) &&
    response.msg.length >= 2 &&
    (response as RequestSettingResponse).msg[1].Index !== undefined &&
    (response as RequestSettingResponse).msg[1].Value !== undefined
  );
}

export function isStatusResponse(response?: IDeviceResponse): response is StatusResponse {
  return isValidDeviceResponse(response) && response.msg.length >= 2 && (response as StatusResponse).msg[1].state !== undefined;
}

export function isWahtsResultsResponse(response?: IDeviceResponse): response is WahtsResultsResponse {
  return (
    isValidDeviceResponse(response) &&
    response.msg.length >= 2 &&
    typeof (response as WahtsResultsResponse).msg[1] === 'object' &&
    (response as WahtsResultsResponse).msg[1] !== null
  );
}

export function isLongNameResponse(response?: IDeviceResponse): response is IDeviceResponse {
  return (
    isValidDeviceResponse(response) &&
    response.msg.length >= 2 &&
    Array.isArray(response.msg[1] && response.msg.length === 1 && typeof response.msg[0] === 'string')
  );
}

export function isFileProgressResponse(response?: IDeviceResponse): response is FileProgressResponse {
  return (
    isValidDeviceResponse(response) &&
    (response as FileProgressResponse).msg[1].BytesTransferred !== undefined &&
    (response as FileProgressResponse).msg[1].TotalBytes !== undefined
  );
}

export function isDirectoryEntryResponse(response?: IDeviceResponse): response is DirectoryEntryResponse {
  return (
    isValidDeviceResponse(response) &&
    (response as DirectoryEntryResponse).msg[1].Path !== undefined &&
    (response as DirectoryEntryResponse).msg[1].SizeBytes !== undefined &&
    (response as DirectoryEntryResponse).msg[1].Attributes !== undefined
  );
}

export function isGetDirectoryResponse(response?: IDeviceResponse): response is GetDirectoryResponse {
  return (
    isValidDeviceResponse(response) &&
    response.msg.length >= 2 &&
    Array.isArray(response.msg[1]) &&
    response.msg[1].every(entry => entry.Path !== undefined && entry.SizeBytes !== undefined && entry.Attributes !== undefined)
  );
}
