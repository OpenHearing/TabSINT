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
        submitText: string,
        isSubmittable: boolean,
        canGoBack: Function,
        responseArea: {
            enableSkip: boolean
        }
    }
}