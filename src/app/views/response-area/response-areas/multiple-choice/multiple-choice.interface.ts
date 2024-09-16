import { CommonResponseAreaInterface } from "../../../../interfaces/page-definition.interface";

export interface MultipleChoiceInterface extends CommonResponseAreaInterface {
    choices?: ChoiceInterface[];
    other?: string; // Text label for an 'other' choice
    verticalSpacing?: number; // Vertical spacing between buttons, given in [px]
    delayEnable?: number; // Delay (ms) before the buttons are active to accept a response
    feedback?: "gradeResponse" | "showCorrect"; // Provide feedback after submit
    exportToCSV?: boolean; // Whether result should be exported to CSV upon submitting exam results. Default: false
}
  
export interface ChoiceInterface {
    id: string;
    text?: string;
    correct?: boolean;
    disable?: boolean;
    textColor?: string;
    backgroundColor?: string;
    fontSize?: string;
  }
