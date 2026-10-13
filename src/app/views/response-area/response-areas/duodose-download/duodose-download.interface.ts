import { CommonResponseAreaInterface } from '../../../../interfaces/page-definition.interface';

export interface DuodoseDownloadInterface extends CommonResponseAreaInterface {
  tabsintId?: string;
}

export interface DoseFile {
  selected: boolean;
  deviceName: string;
  parsedDatetime: string;
  longName: string;
  sessionName: string;
  datetime: string;
}
