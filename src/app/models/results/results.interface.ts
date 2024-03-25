export interface ResultsInterface {
    name: string;
    current: {
        qrString: string,
        siteId: string,
        elapsedTime: string,
        testDateTime: string,
        protocolName: string,
        isSkipped?: boolean
        testResults: any
    }
}