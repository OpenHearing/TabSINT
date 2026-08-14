import { GitlabConfigInterface } from '../models/disk/disk.interface';
import { DeviceType } from '../utilities/constants';

export const MediaRepoProtocolTarget = 'Protocol';
export type MediaRepoTarget = DeviceType | typeof MediaRepoProtocolTarget;

export interface MediaReposInterface extends GitlabConfigInterface {
  date: string;
  path: string;
  target: MediaRepoTarget;
}
