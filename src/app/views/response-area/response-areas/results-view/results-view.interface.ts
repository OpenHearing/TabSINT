import { CommonResponseAreaInterface } from '../../../../interfaces/page-definition.interface';

export interface ResultsViewResponseAreaInterface extends CommonResponseAreaInterface {
  type: 'resultsViewResponseArea';
  pageIdsToDisplay: string[];
}
