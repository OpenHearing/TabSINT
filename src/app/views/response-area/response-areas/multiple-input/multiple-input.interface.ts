import { CommonResponseAreaInterface } from '../../../../interfaces/page-definition.interface';

export interface MultipleInputInterface extends CommonResponseAreaInterface {
  verticalSpacing?: number; // in pixels
  textAlign?: 'left' | 'right' | 'center';
  review?: boolean;
  inputList: InputListItem[];
}

export interface InputListItem {
  inputType?: 'text' | 'number' | 'dropdown' | 'date' | 'multi-dropdown';
  text: string;
  options?: string[]; // Only for dropdown or multi-dropdown
  required?: boolean;
  dateProperties?: {
    maxDate?: string; // ISO formatted string YYYY-MM-DD or 'today'
    minDate?: string; // ISO formatted string YYYY-MM-DD or 'today'
    default?: 'none' | 'today'; // Initialize date with 'today', or leave empty
  };
  notes?: string;
  value?: string | number; // Fallback initial value; date inputs with dateProperties.default 'today' use today's date instead
}

export interface MultiDropdownOption {
  id: number;
  label: string;
}

/** Response for the multiple input response area: one value per input, in inputList order. */
export type MultipleInputResponseInterface = (string | number | string[] | undefined)[];
