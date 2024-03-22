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
            enableSkip: boolean,
            type: string
        },
        title: string,
        instructionText: string,
        subtitle: string,
        image?: {
            path: string
        },
        questionSubText: string,
        questionMainText: string,
        loadingRequired: boolean
        loadingActive: boolean
    },
    current: {
        qrString: string,
        siteId: string,
        elapsedTime: string,
        testDateTime: string,
        protocolName: string,
        testResults: any
    }
}