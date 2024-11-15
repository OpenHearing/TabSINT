import { CommonResponseAreaInterface } from "../../../../interfaces/page-definition.interface";

export interface MultipleInputInterface extends CommonResponseAreaInterface {
    verticalSpacing?: number; // in pixels
    textAlign?: "left" | "right" | "center";
    review?: boolean;
    inputList: InputListItem[];
  }
  
  interface InputListItem {
    inputType?: "text" | "number" | "dropdown" | "date" | "multi-dropdown" | "yes-no";
    text: string;
    options?: string[]; // Only for dropdown or multi-dropdown
    required?: boolean;
    exportToCSV?: boolean;
    dateProperties?: {
      maxDate?: string; // ISO formatted string YYYY-MM-DD or 'today'
      minDate?: string; // ISO formatted string YYYY-MM-DD or 'today'
    };
  }
  