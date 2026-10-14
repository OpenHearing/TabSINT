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
}

export interface MultiDropdownOption {
  id: number;
  label: string;
}
