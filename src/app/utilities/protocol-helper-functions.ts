import _ from 'lodash';
import { ProtocolMetaInterface, ProtocolInterface } from '../models/protocol/protocol.interface';
import { GitlabConfigInterface } from '../models/disk/disk.interface';

export function findDuplicateProtocols(p: ProtocolInterface, loadedP: ProtocolInterface[]) {
  return _.filter(loadedP, {
    name: p.name,
    path: p.path,
    date: p.date,
    contentURI: p.contentURI,
  });
}

export function getProtocolMetaData(protocol: ProtocolMetaInterface): ProtocolMetaInterface {
  return {
    group: protocol.group,
    name: protocol.name,
    path: protocol.path,
    date: protocol.date,
    version: protocol.version,
    creator: protocol.creator,
    server: protocol.server,
    admin: protocol.admin,
    contentURI: protocol.contentURI,
    gitlabConfig: protocol.gitlabConfig,
  };
}

/**
 * Copy a gitlab configuration without its token.
 * @param gitlabConfig The gitlab configuration to remove the token from.
 * @returns A copy of the configuration without the token.
 */
export function redactSecrets(gitlabConfig: GitlabConfigInterface): Omit<GitlabConfigInterface, 'token'> {
  const config = structuredClone(gitlabConfig);
  return _.omit(config, 'token' satisfies keyof GitlabConfigInterface);
}
