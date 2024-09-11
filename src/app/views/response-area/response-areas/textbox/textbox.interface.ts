import { CommonResponseAreaInterface } from "../../../../interfaces/page-definition.interface";

export interface TextBoxInterface extends CommonResponseAreaInterface {
    rows?: number;
    exportToCSV?: boolean;
}

const defaultTextBoxInterface: TextBoxInterface = {
    enableSkip: false,
    responseRequired: true,
    type: "textboxResponseArea",
    rows: 1,
    exportToCSV: false
  };