export interface TextBoxInterface {
    type: string;
    rows?: number;
    exportToCSV?: boolean;
}

const defaultTextBoxInterface: TextBoxInterface = {
    type: "textboxResponseArea",
    rows: 1,
    exportToCSV: false
  };