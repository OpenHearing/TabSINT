export interface ResultsInterface {
    name: string;
    current: {
        qrString?: string;
        siteId?: string;
        elapsedTime?: string;
        testDateTime?: string;
        protocolName?: string;
        isSkipped?: boolean;
        testResults?: any;
        response?: any;
        responseStartTime?: any;
        nResponses?: any;
        nCorrect?: any;
        nIncorrect?: any;
    },
    previous: any;
}