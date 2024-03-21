export interface ResultsInterface {
    name: string;
    state: {
        mode: string,
        progress: {
            pctProgress: string
        }
    },
    page: {
        enableBackButton: boolean,
        hideProgressBar: boolean,
        helpText: string,
        submitText: string | undefined,
        isSubmittable: boolean,
        canGoBack: Function,
        responseArea: {
            enableSkip: boolean
        },
        title: string,
        instructionText: string,
        subtitle: string
    }
}