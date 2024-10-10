import { Dictionary } from "lodash";
import { LoadingProtocolInterface } from "../interfaces/loading-protocol-object.interface";
import { PageInterface } from "../models/page/page.interface";
import { ProtocolMetaInterface, ProtocolInterface } from "../models/protocol/protocol.interface";
import { ProtocolServer } from "./constants";
import { checkIfCanGoBack } from "./exam-helper-functions";
import { DiskInterface } from "../models/disk/disk.interface";

export const metaDefaults: ProtocolMetaInterface = {
    name: '',
    date: '',
    version: '',
    server: ProtocolServer.LocalServer,
    admin: false
};

export const partialMetaDefaults = {
    date: new Date().toJSON(),
    version: '0.0',
    server: ProtocolServer.Developer,
    admin: true
};

export function loadingProtocolDefaults(disk: DiskInterface): LoadingProtocolInterface {
    let loadingProtocol: LoadingProtocolInterface = {
        protocol: protocolDefaults,
        calibration: undefined,
        requiresValidation: disk.validateProtocols,
        meta: { ...metaDefaults, ...{contentURI: disk.contentURI} },
        overwrite: false,
        notify: false
    }

    return loadingProtocol;
};

export const PageInterfaceDefaults: PageInterface = {
    id: '',
    enableBackButton: false,
    title: '',
    questionMainText: '',
    questionSubText: '',
    instructionText: '',
    helpText: '',
    responseArea: {
        type: ''
    },
    submitText: 'Begin',
    // followOns: [],
    name: '',
    filename: '',
    units: '',
    example: 0,
    other: [],
    dict: {},
    hideProgressBar: true,
    isSubmittable: true,
    canGoBack: checkIfCanGoBack(),
    subtitle: '',
    loadingRequired: false,
    loadingActive: false,
    exportToCSV: false
}

export const protocolDefaults: ProtocolInterface = {
    ...metaDefaults,
    pages: [PageInterfaceDefaults]
};

export const responseDefaultByResponseAreaType: Dictionary<string> = {
    'textboxResponseArea': '',
    'multipleChoiceResponseArea': '',
    'manualAudiometryResponseArea' : '',
    'calibrationResponseArea':''
}
