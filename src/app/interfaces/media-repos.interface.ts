import { GitlabConfigInterface } from '../models/disk/disk.interface';

export interface MediaReposInterface extends GitlabConfigInterface {
  date: string;
  path: string;
}
