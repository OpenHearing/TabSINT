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
    // testVar: any;

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

        // this.testVar = (this.protocol.activeProtocol?.pages?.[this.state.examIndex] as any)?.pages?.[this.state.examIndex];
    }

    
    currentPage: any;

    /**
     * Example of typedoc
     *
     * @remarks can put remarks here
     * @param x description of variable x
     * @returns what the function returns
     * @customExpression can define anything like this as well
    */
    exampleFunction(x:number) {
        return
    }

    // Necessary functions

    /**
     * Example of typedoc
     *
     * @remarks can put remarks here
     * @param x description of variable x
     * @returns what the function returns
     * @customExpression can define anything like this as well
    */
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
        
        let pages = (this.protocol.activeProtocol?.pages?.[this.state.examIndex] as any)?.pages;
        this.addPagesToStack(pages);
        this.currentPage = this.state.protocolStack[this.state.examIndex];
        this.state.isSubmittable = this.checkIfPageIsSubmittable();
    }

    reset() {
        console.log("ExamService reset() called");

        this.results.current = {};
        // TODO: Add more information about the protocol / page into results here
        /* This should include the ID for current page?
        Can we have multiple results from same pages with repeated ID? Or would it overwrite the exam?
        This seems rather complicated in current tabsint. I think just having results for each page will work.
        If the page comes up again the ID wont duplicate and instead we overwrite the results for that page. 
        This would mean that pushing results needs logic to overwrite if it already exists.
        */
    }

    submitDefault() {
        console.log("ExamService submitDefault() called");
        // console.log("this.results.current",this.results.current);

        // TODO: Below line should handle results with more logic, breakout a functoin here.
        this.results.previous.push(this.results.current);
        this.advancePage();
        // TODO: The above line might need to be async and awaited

        this.state.isSubmittable = this.checkIfPageIsSubmittable();
        this.submit = this.submitDefault;
        this.reset();

        console.log("this.results.previous",this.results.previous);
    }

    // General protocol parsing functions (maybe move to utilities? they do need model access...)

    advancePage() {
        // console.log("protocolStack, examIndex",this.state.protocolStack,this.state.examIndex);
        let nextExamIndex = this.state.examIndex + 1;
        if (this.state.protocolStack.length <= nextExamIndex) {
            let nextID = this.findFollowOn();
            if (nextID != undefined) {
                let pages = this.getSubProtocol(nextID);
                this.state.protocolStack = [];
                this.state.examIndex = 0;
                this.addPagesToStack(pages);
            } else {
                this.state.protocolStack = [];
                this.state.examIndex = 0;
                this.state.examState = ExamState.NotReady;
            }
        } else {
            // console.log("incrementing examIndex");
            this.state.examIndex = nextExamIndex;
        }
        this.currentPage = this.state.protocolStack[this.state.examIndex];

    }

    addPagesToStack(pages:any) {
        let extraPages:any;
        pages.forEach( (page:any)=> {
            if (page?.reference) {
                extraPages = this.getSubProtocol(page?.reference);
                this.addPagesToStack(extraPages);
            } else {
                this.state.protocolStack.push(page);
            }
        });
    }

    findFollowOn() {
        let id: string | undefined = undefined;
        this.state.protocolStack[this.state.examIndex]?.followOns.forEach((followOn:any) => {
            // TODO: Fix this hacky way of finding the id, maybe just eval the conditional?
            if (this.results.current.response == followOn.conditional.split("==")[1].replaceAll("'","")) {
                id = followOn.target.reference;
            }
        });
        return id;
    }

    findReference(exInd: number | undefined = undefined) {
        console.log("ExamService findReference() called");
        if (exInd == undefined) {
            exInd = this.state.examIndex;
        }
        let referenceID = this.state.protocolStack[exInd]?.reference;
        return referenceID;
    }

    getSubProtocol(id: string | undefined) {
        console.log("ExamService getSubProtocol() called");

        let pages:any;
        if (id == undefined) {
            return pages
        };

        // check the main protocol definition
        this.protocol.activeProtocol?.pages?.forEach((subProtocol:any) => {
            if (id == subProtocol?.protocolId) {
                pages = subProtocol?.pages;
                return pages;
            }
        });

        // check subProtocol
        this.protocol.activeProtocol?.subProtocols?.forEach((subProtocol) => {
            if (id == subProtocol?.protocolId) {
                pages = subProtocol?.pages;
                return pages;
            }
        });
        // console.log("subProtocol pages found:",pages);
        return pages;
    }

    checkIfPageIsSubmittable() {
        // TODO: These defaults should come from responseArea schema
        if (this.currentPage.responseArea.responseRequired != undefined) {
            return !this.currentPage.responseArea.responseRequired
        } else {
            if (this.currentPage.responseArea.type == "multipleChoiceResponseArea") {
                return false
            } else {
                return true
            }
        }
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