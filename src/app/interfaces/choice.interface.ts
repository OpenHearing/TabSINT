export interface ChoiceInterface {
  id: string | number;
  text?: string;
  correct?: boolean;
  disable?: boolean;
  textColor?: string;
  backgroundColor?: string;
  fontSize?: string;
}

export interface ChoiceResponseInterface {
  selected: string[] | string | number;
}

export interface ChoiceButtonClassOptionsInterface {
  buttonScheme?: string;
  feedback?: string;
  disableButton?: boolean;
}
