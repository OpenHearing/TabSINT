import { ChoiceInterface } from '../../../../interfaces/choice.interface';
import { CommonResponseAreaInterface } from '../../../../interfaces/page-definition.interface';
import { RowInterface } from '../../../../interfaces/row.interface';

export interface ButtonGridInterface extends CommonResponseAreaInterface {
  feedback?: 'gradeResponse' | 'showCorrect';
  rows: RowInterface[];
  verticalSpacing?: number;
  horizontalSpacing?: number;
  delayEnable?: number;
  choices?: ChoiceInterface[];
}
