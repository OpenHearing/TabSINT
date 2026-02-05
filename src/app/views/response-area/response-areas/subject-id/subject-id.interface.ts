import { CommonResponseAreaInterface } from '../../../../interfaces/page-definition.interface';

export interface SubjectIdInterface extends CommonResponseAreaInterface {
  generate: boolean;
  exportToCSV?: boolean;
}
