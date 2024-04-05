import * as _ from 'lodash';
import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Logger } from '../utilities/logger.service';
import { AppState, ExamState } from '../utilities/constants';
import { ResultsInterface } from '../models/results/results.interface';
import { ResultsModel } from '../models/results/results.service';
import { StateInterface } from '../models/state/state.interface';
import { StateModel } from '../models/state/state.service';
import { ProtocolModelInterface } from '../models/protocol/protocol-model.interface';
import { ProtocolModel } from '../models/protocol/protocol.service';
import { ProtocolService } from './protocol.service';
import { DiskInterface } from '../models/disk/disk.interface';
import { DiskModel } from '../models/disk/disk.service';
import { Notifications } from '../utilities/notifications.service';
import { bluetoothTimeout } from '../utilities/constants';

@Injectable({
    providedIn: 'root',
})

export class ExamService {
    protocol: ProtocolModelInterface
    disk: DiskInterface;
    results: ResultsInterface
    state: StateInterface;
    ExamState = ExamState;
    AppState = AppState;
    testVar: any;

    constructor (
        public resultsModel: ResultsModel,
        public protocolService: ProtocolService,
        public protocolM: ProtocolModel,
        public stateModel: StateModel,
        private translate: TranslateService,
        private logger: Logger,
        private diskModel: DiskModel,
        private notifications: Notifications
    ) {
        this.results = this.resultsModel.getResults();
        this.state = this.stateModel.getState();
        this.disk = this.diskModel.getDisk();
        this.protocol = this.protocolM.getProtocolModel();

        this.testVar = (this.protocol.activeProtocol?.pages?.[this.state.examIndex] as any)?.pages?.[this.state.examIndex];
    }

    
    currentPage: any;

    // Necessary functions

    switchToExamView() {
        console.log("ExamService switchToExamView() called");
        if (this.protocol.activeProtocol == undefined) {
            // throw alert that no protocol is loaded
            return
        }

        if (this.state.protocolStack.length == 0) {
            this.state.examState = ExamState.Ready;
        }
        else {
            this.activatePage();
        }
    }

    async begin() {
        console.log("ExamService begin() called");
        // TODO: This should be synchronous?
        await this.updateProtocolStack();
        this.state.examState = ExamState.Testing;
    }

    activatePage() {
        console.log("ExamService activatePage() called");
    }

    submit() {
        console.log("ExamService submit() called");
    }

    skip() {
        console.log("ExamService skip() called");
    }

    back() {
        console.log("ExamService back() called");
    }




    // Internal functions

    async updateProtocolStack() {
        console.log("ExamService updateProtocolStack() called");
        console.log("this.protocol.activeProtocol",this.protocol.activeProtocol);
        // TODO: Completely overhaul the protocol loading, parsing, and handling
        // (this.protocol.activeProtocol?.pages?.[this.state.examIndex] as any)?.pages?.[this.state.examIndex];
        let page = (this.protocol.activeProtocol?.pages?.[this.state.examIndex] as any)?.pages?.[this.state.examIndex];
        this.state.protocolStack = [page];
        this.currentPage = this.state.protocolStack[this.state.examIndex];
    }

    reset() {
        console.log("ExamService reset() called");
    }

    submitDefault() {
        console.log("ExamService submitDefault() called");
    }




    // Ignore the below functions for now

    switchToAdminView() {
        console.log("ExamService switchToAdminView() called");
    }

    finishActivateMedia() {
        console.log("ExamService finishActivateMedia() called");
    }

    help() {
        console.log("ExamService help() called");
    }

    closeAll() {
        console.log("ExamService closeAll() called");
    }

}