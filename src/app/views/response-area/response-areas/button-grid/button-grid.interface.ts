import { CommonResponseAreaInterface } from '../../../../interfaces/page-definition.interface';
import { ChoiceInterface } from '../../../../interfaces/choice.interface';

export interface ButtonGridInterface extends CommonResponseAreaInterface {
  choices: ChoiceInterface[];
  buttonScheme?: 'markCorrect' | 'markIncorrect';
  feedback?: 'gradeResponse' | 'showCorrect';
  other?: string;
  verticalSpacing?: number;
  exportToCSV?: boolean;
}
