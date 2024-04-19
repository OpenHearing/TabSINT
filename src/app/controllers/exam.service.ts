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
import { Observable, BehaviorSubject } from 'rxjs';

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
    }

    // Local variables for exam service
    currentPage: any;
    currentPageObservable = new BehaviorSubject(undefined);

    // Necessary functions

    /** Switches to exam view
     * @remarks Can be called from any other TabSINT view. If protocolStack is not empty, the exam
     * will proceed where it left off. Otherwise examState gets changed to Ready.
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
            // TODO: This is not currently doing anything
            this.activatePage();
        }
    }

    /** Begins TabSINT exam.
     * @remarks Adds pages to protocolStack and changes examState to testing.
     * @models protocol, state
    */
    async begin() {
        console.log("ExamService begin() called");
        console.log("this.protocol.activeProtocol",this.protocol.activeProtocol);
        
        // TODO: Change how the first main page gets found, maybe this happens with protocol service?
        let pages = (this.protocol.activeProtocol?.pages?.[this.state.examIndex] as any)?.pages;
        this.addPagesToStack(pages);
        // TODO: This initialization could be clearer? Maybe with another function? This is repeated in advancePage...
        this.currentPage = this.state.protocolStack[this.state.examIndex];
        this.currentPageObservable.next(this.currentPage);
        // TODO: Move the results initilization into its own file? Could subscribe to the currentPageObservable...
        this.initializeResults(this.currentPage);
        this.state.isSubmittable = this.checkIfPageIsSubmittable();
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

    /** Resets exam related parameters and states.
     * @remarks Currently only resets the current results
     * @models results
    */
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

    /** Default submit function for exam pages.
     * @remarks Appends current results to previous results, calls advancePage(), and resets.
     * @models results, state
    */
    submitDefault() {
        console.log("ExamService submitDefault() called");
        // console.log("this.results.current",this.results.current);

        // TODO: Below line should handle results with more logic, breakout a function here.
        this.results.previous.push(JSON.parse(JSON.stringify(this.results.current)));
        // TODO: The below line might need to be async and awaited
        this.advancePage();

        this.state.isSubmittable = this.checkIfPageIsSubmittable();
        this.submit = this.submitDefault;
        

        console.log("this.results.previous",this.results.previous);
    }

    // General protocol parsing functions (maybe move to utilities? they do need model access...)

    /** Advance to next page in the exam
     * @remarks Advances to next page in protocolStack. If there is no next page it will
     * search for a followOn. The protocolStack will be updated and exam will proceed
     * to the correct page.
     * @models state
    */
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
        this.currentPageObservable.next(this.currentPage);
        // TODO: Should reset be here? Or in initilizeResults? All reset does is reset current results
        this.reset();
        // TODO: This should do something with the results...
        this.initializeResults(this.currentPage);
    }

    /** Parse page objects and add them to the protocolStack.
     * @remarks Adds pages to protocolStack. This will parse any page with a reference and put the 
     * correct pages in place.
     * @models state
     * @inputs pages: list of page objects
    */
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

    /** Finds followOn from current page.
     * @remarks Finds and returns the followOn ID from a page specified from a response.
     * @models state, results
     * @returns followOn ID: string or undefined
    */
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

    /** Finds pages contained in a subProtocol.
     * @remarks Finds and returns all pages inside of a subProtocol.
     * @models protocol
     * @returns pages: list of page objects
    */
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

    /** Checks if a page is submittable.
     * @remarks Checks if a page is submittable and returns a boolean
     * @returns boolean if page is submittable
    */
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

    /** Initializes results after advancing to a new page.
     * @remarks Initializes results with pageID and other information. This should be moved to results service.
     * @inputs this.currentPage. Not actually needed as an input but this function will be moved and then it will be.
     * @models results
    */
    initializeResults(currentPage:any) {
        //TODO: Update this to get correct and all necessary information
        this.results.current.pageID = currentPage.id;
        this.results.current.responseArea = currentPage.responseArea;
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