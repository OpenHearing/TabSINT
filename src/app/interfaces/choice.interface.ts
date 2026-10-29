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
  selected: (string | number)[] | string | number | null;
  other?: string;
}

/** Response for choice response areas that allow several selections (checkbox, button grid). */
export interface MultiSelectChoiceResponseInterface extends ChoiceResponseInterface {
  selected: (string | number)[];
}

/** Response for choice response areas that allow a single selection (multiple choice). */
export interface SingleSelectChoiceResponseInterface extends ChoiceResponseInterface {
  selected: string | number | null;
}

export interface ChoiceButtonClassOptionsInterface {
  buttonScheme?: string;
  feedback?: string;
  disableButton?: boolean;
}
