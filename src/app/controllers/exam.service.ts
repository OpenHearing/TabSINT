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
import { PageDefinition } from '../interfaces/protocol-schema.interface';

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
        // TODO: allow this to add multiple pages to the stack (if applicable)
        this.state.protocolStack = [page];
        this.currentPage = this.state.protocolStack[this.state.examIndex];
    }

    reset() {
        console.log("ExamService reset() called");

        this.results.current = {};
    }

    submitDefault() {
        console.log("ExamService submitDefault() called");

        // console.log("this.results.current",this.results.current);
        this.results.previous.push(this.results.current);
        
        console.log(this.state.protocolStack,this.state.examIndex);
        if (this.state.protocolStack.length <= this.state.examIndex + 1) {
            let followOnId = this.findFollowOn();
            let pages = this.findSubProtocol(followOnId);
            // This should eventually be able to add multiple pages? Or page should already be multiple?
            if (pages.length > 0) {
                this.state.protocolStack = [];
                this.state.examIndex = 0;
                pages.forEach( (page:any)=> {
                    // TODO: If page has a reference, it should be parsed so we can input the actual page
                    this.state.protocolStack.push(page);
                });
            } else {
                this.state.protocolStack = [];
                this.state.examIndex = 0;
            }
        } else {
            // Do something like this... Will need ot be changed though
            console.log("incrementing examIndex");
            this.state.examIndex +=1 ;
            this.currentPage = this.state.protocolStack[this.state.examIndex];
        }
        // Go to next page if it is in the pageStack or check for subProtocols
        this.currentPage = this.state.protocolStack[this.state.examIndex];
        this.submit = this.submitDefault;
        this.reset();
    }

    // General protocol parsing functions (maybe move to utilities? they do need model access...)

    findFollowOn() {
        let id: any;
        this.state.protocolStack[this.state.examIndex]?.followOns.forEach((followOn:any) => {
            // TODO: Fix this hacky way of finding the id, maybe just eval the conditional?
            if (this.results.current.response == followOn.conditional.split("==")[1].replaceAll("'","")) {
                id = followOn.target.reference;
            }
        });
        return id
    }

    findSubProtocol(id:string) {
        console.log("ExamService findSubProtocol() called");
        let pages:any;
        this.protocol.activeProtocol?.subProtocols?.forEach((subProtocol) => {
            if (id == subProtocol?.protocolId) {
                pages = subProtocol?.pages;
            }
        });
        console.log("subProtocol pages found:",pages);
        return pages;
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