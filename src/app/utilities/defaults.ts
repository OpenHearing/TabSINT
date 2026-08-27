import { LoadingProtocolInterface } from '../interfaces/loading-protocol-object.interface';
import { PageInterface } from '../models/page/page.interface';
import { ProtocolMetaInterface, ProtocolInterface } from '../models/protocol/protocol.interface';
import { ProtocolServer } from './constants';
import { checkIfCanGoBack } from './exam-helper-functions';
import { DiskInterface } from '../models/disk/disk.interface';

export const metaDefaults: ProtocolMetaInterface = {
  name: '',
  date: '',
  version: '',
  server: ProtocolServer.LocalServer,
  admin: false,
};

export const partialMetaDefaults = {
  date: new Date().toJSON(),
  version: '0.0',
  server: ProtocolServer.Developer,
  admin: true,
};

export function loadingProtocolDefaults(disk: DiskInterface): LoadingProtocolInterface {
  const loadingProtocol: LoadingProtocolInterface = {
    protocol: protocolDefaults,
    calibration: undefined,
    meta: { ...metaDefaults, ...{ contentURI: disk.contentURI } },
    overwrite: false,
    notify: false,
  };

  return loadingProtocol;
}

export const pageInterfaceDefaults: PageInterface = {
  _uuid: crypto.randomUUID(),
  id: '',
  enableBackButton: false,
  title: '',
  questionMainText: '',
  questionSubText: '',
  instructionText: '',
  helpText: '',
  responseArea: {
    type: '',
  },
  submitText: undefined,
  // followOns: [],
  name: '',
  filename: '',
  units: '',
  example: 0,
  other: [],
  dict: {},
  isSubmittable: true,
  canGoBack: checkIfCanGoBack(),
  subtitle: '',
  loadingRequired: false,
  loadingActive: false,
};

export const protocolDefaults: ProtocolInterface = {
  ...metaDefaults,
  pages: [pageInterfaceDefaults],
};
