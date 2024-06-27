import { LoadingProtocolInterface } from "../interfaces/loading-protocol-object.interface";
import { PageInterface } from "../models/page/page.interface";
import { ProtocolMetaInterface } from "../models/protocol/protocol.interface";
import { ProtocolInterface } from "../models/protocol/protocol.interface";
import { ProtocolServer } from "./constants";
import { checkIfCanGoBack } from "./exam-helper-functions";

export const metaDefaults: ProtocolMetaInterface = {
    group: '',
    name: '',
    path: '',
    date: '',
    version: '',
    creator: '',
    server: ProtocolServer.LocalServer,
    admin: false,
    contentURI: ''
};

export const partialMetaDefaults = {
    id: '',
    group: '',
    name: '',
    date: '',
    version: '',
    contentURI: ''
};

export function loadingProtocolDefaults(_requiresValidation: boolean = true): LoadingProtocolInterface {
    let loadingProtocol: LoadingProtocolInterface = {
        protocol: protocolDefaults,
        calibration: undefined,
        requiresValidation: _requiresValidation,
        meta: metaDefaults,
        overwrite: false,
        notify: false
    }

    return loadingProtocol;
};

export const PageInterfaceDefaults: PageInterface = {
    type: '',
    id: '',
    enableBackButton: false,
    title: '',
    questionMainText: '',
    questionSubText: '',
    instructionText: '',
    helpText: '',
    responseArea: {
        enableSkip: false,
        type: '',
        responseRequired: false,
        inputList: function (inputList: any, arg1: (input: any) => void): unknown {
            throw new Error("Function not implemented.");
        },
        html: undefined,
        image: undefined
    },
    submitText: 'Begin',
    followOns: [],
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
    id: '',
    protocolId: '',
    pages: PageInterfaceDefaults
};
