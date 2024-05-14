export interface MultipleChoiceInterface {
    type: string;
    choices?: Choice[];
    other?: string; // Text label for an 'other' choice
    verticalSpacing?: number; // Vertical spacing between buttons, given in [px]
    delayEnable?: number; // Delay (ms) before the buttons are active to accept a response
    feedback?: "gradeResponse" | "showCorrect"; // Provide feedback after submit
    exportToCSV?: boolean; // Whether result should be exported to CSV upon submitting exam results. Default: false
}
  
interface Choice {
    label: string;
    value: string;
}

const defaultMultipleChoiseInterface: MultipleChoiceInterface = {
    type: "multipleChoiceResponseArea",
    exportToCSV: false,
    choices: []
};