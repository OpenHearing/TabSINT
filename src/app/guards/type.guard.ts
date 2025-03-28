import { ConnectedDevice, NewConnectedDevice } from "../interfaces/connected-device.interface";
import { PageDefinition, ProtocolReferenceInterface } from "../interfaces/page-definition.interface";
import { ProtocolSchemaInterface } from "../interfaces/protocol-schema.interface";
import { PageInterface } from "../models/page/page.interface";
import { PageTypes } from "../types/custom-types";

export function isProtocolSchemaInterface(page: PageTypes): page is ProtocolSchemaInterface {
    return (page as ProtocolSchemaInterface).pages !== undefined;
}

export function isPageDefinition(page: PageTypes): page is PageDefinition {
    return (page as PageDefinition).id !== undefined;
}

export function isProtocolReferenceInterface(page: PageTypes): page is ProtocolReferenceInterface {
    return (page as ProtocolReferenceInterface).reference !== undefined;
}

export function isTympanDevice(device: ConnectedDevice | NewConnectedDevice) {
    return device.type == "Tympan";
}

export function isManualAudiometryResponseArea(page: PageInterface): boolean {
    return page?.responseArea?.type === "manualAudiometryResponseArea";
}
