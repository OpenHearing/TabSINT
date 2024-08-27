import { ChaWavfileInterface, ImageInterface, ResponseArea, VideoInterface, WavfileInterface } from "../../interfaces/page-definition.interface";
import { ProtocolServer } from "../../utilities/constants";
import { ProtocolInterface } from "../protocol/protocol.interface";

export interface ResultsInterface {
    currentPage: CurrentResults;
    currentExam: ExamResults;
}

export interface CurrentResults {
    pageId: string;
    response?: any;
    correct?: boolean;
    isSkipped?: boolean;
    responseArea?: string;
    page: {
      wavfiles?: WavfileInterface[],
      chaWavFiles?: ChaWavfileInterface[],
      image?: ImageInterface,
      video?: VideoInterface
    }
}

export interface ExamResults {
    protocolName: string;
    protocolId: string;
    protocol: ProtocolInterface;
    testDateTime?: string;
    elapsedTime?: string;
    exportLocation?: ProtocolServer;
    responses: any;
    partialresults?: any;
    softwareVersion: any; // TODO: define softwareVersion interface
    tabletLocation: {
        latitude?: number,
        longitude?: number,
        accuracy?: number
      };
    headset: string;
    calibrationVersion: any; // TODO: define calibrationVersion interface
}
