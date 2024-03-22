export interface PageInterface {
    name: string;
    filename: string;
    units: string;
    example: number;
    other: Array<string>;
    dict: object;
    enableBackButton: boolean;
    hideProgressBar: boolean;
    helpText: string;
    submitText: string | undefined;
    isSubmittable: boolean;
    canGoBack: Function;
    responseArea: {
        enableSkip: boolean;
        type: string;
    };
    title: string;
    instructionText: string;
    subtitle: string,
    image?: {
        path: string
    };
    questionSubText: string;
    questionMainText: string;
    loadingRequired: boolean;
    loadingActive: boolean;
}