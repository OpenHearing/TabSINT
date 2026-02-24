import { LoadingProtocolInterface } from '../interfaces/loading-protocol-object.interface';
import { ProtocolMetaInterface, ProtocolInterface } from '../models/protocol/protocol.interface';
import { ProtocolServer } from './constants';
import { DiskInterface } from '../models/disk/disk.interface';
import { PageInterface } from '../interfaces/page-definition.interface';

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
    requiresValidation: disk.preferences.validateProtocols,
    meta: { ...metaDefaults, ...{ contentURI: disk.contentURI } },
    overwrite: false,
    notify: false,
  };

  return loadingProtocol;
}

export const pageInterfaceDefaults: PageInterface = {
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
};

export const protocolDefaults: ProtocolInterface = {
  ...metaDefaults,
  pages: [pageInterfaceDefaults],
};
