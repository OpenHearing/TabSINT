import { CommonResponseAreaInterface } from '../../../../interfaces/page-definition.interface';

export interface CheckboxInterface extends CommonResponseAreaInterface {
  choices: CheckboxChoiceInterface[];
  buttonScheme?: string;
  other?: string;
  verticalSpacing?: number;
  exportToCSV?: boolean;
}

export interface CheckboxChoiceInterface {
  id: string;
  text?: string;
  correct?: boolean;
  disable?: boolean;
  textColor?: string;
  backgroundColor?: string;
  fontSize?: string;
}
