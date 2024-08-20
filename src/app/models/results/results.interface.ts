import { ProtocolServer } from "../../utilities/constants";
import { ActiveProtocolInterface } from "../protocol/protocol.interface";

export interface ResultsInterface {
    currentPage: CurrentResults;
    currentExam: ExamResults;
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

export interface ExamResults {
    protocolName: string;
    protocolId: string;
    protocol: ActiveProtocolInterface;
    testDateTime?: string;
    elapsedTime?: string;
    exportLocation?: ProtocolServer;
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
