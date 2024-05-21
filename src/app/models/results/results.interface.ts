import { ProtocolInterface } from "../protocol/protocol.interface";

export interface ResultsInterface {
    current: CurrentResults;
    testResults: TestResults;
}

export interface CurrentResults {
    pageId: string;
    response?: any;
    correct?: boolean;
    isSkipped?: boolean;
    responseArea?: any;
    page: {
      wavfiles?: any,
      chaWavFiles?: any,
      image?: any,
      video?: any
    }
}

export interface TestResults {
    protocolName: string;
    protocolId: string;
    protocol: ProtocolInterface;
    testDateTime?: string;
    elapsedTime?: string;
    responses: any;
    partialresults?: any;
    softwareVersion: any;
    tabletLocation: {
        latitude?: number,
        longitude?: number,
        accuracy?: number
      };
    headset: string;
    calibrationVersion: any;
}