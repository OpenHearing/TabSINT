import * as _ from 'lodash';
import { Injectable } from '@angular/core';

import { ResultsService } from './results.service';

import { ResultsInterface } from '../models/results/results.interface';
import { StateInterface } from '../models/state/state.interface';
import { DiskInterface } from '../models/disk/disk.interface';
import { ProtocolModelInterface } from '../models/protocol/protocol.interface';

import { ResultsModel } from '../models/results/results-model.service';
import { StateModel } from '../models/state/state.service';
import { ProtocolModel } from '../models/protocol/protocol-model.service';
import { DiskModel } from '../models/disk/disk.service';

import { DialogType, ExamState } from '../utilities/constants';
import { Notifications } from '../utilities/notifications.service';
import { PageModel } from '../models/page/page.service';
import { PageInterface } from '../models/page/page.interface';
import { calculateElapsedTime } from '../utilities/exam-helper-functions';

@Injectable({
    providedIn: 'root',
})

export class ExamService {
    protocol: ProtocolModelInterface;
    disk: DiskInterface;
    results: ResultsInterface;
    state: StateInterface;
    currentPage: PageInterface;

    constructor (
        public resultsService: ResultsService,
        public resultsModel: ResultsModel,
        public pageModel: PageModel,
        public protocolM: ProtocolModel,
        public stateModel: StateModel,
        private diskModel: DiskModel,
        private notifications: Notifications
    ) {
        this.results = this.resultsModel.getResults();
        this.currentPage = this.pageModel.getPage();
        this.state = this.stateModel.getState();
        this.disk = this.diskModel.getDisk();
        this.protocol = this.protocolM.getProtocolModel();
    }

    /** Switches to exam view.
     * @summary Can be called from any other TabSINT view. If pageModel.stack is not empty, the exam
     * will proceed where it left off. Otherwise examState gets changed to Ready.
    */
    switchToExamView() {
        if (this.protocol.activeProtocol == undefined) {
            this.notifications.alert({
                title: "Alert",
                content: "No protocol has been loaded. Please scan your QR Code or navigate to the Admin View and load a protocol.",
                type: DialogType.Alert
            }).subscribe();
            return
        }

        if (this.pageModel.stack.length == 0) {
            this.state.examState = ExamState.Ready;
        }
    }

    /** Begins TabSINT exam.
     * @summary Adds pages to protocolStack and changes examState to Testing.
     * @models protocol, state
    */
    async begin() {        
        this.addPagesToStack(this.protocol.activeProtocol?.pages, 0);
        this.resultsService.initializeExamResults();
        this.startPage();
        this.state.examState = ExamState.Testing; 
    }

    /** Default submit function for exam pages.
     * @summary Appends current page results to current exam results, calls advancePage(), and resets.
     * @models results, state
    */
    submitDefault() {
        console.log("ExamService submitDefault() called");
        this.resultsService.pushResults(this.results.currentPage);
        // TODO: The below line might need to be async and awaited
        this.advancePage();

        this.state.isSubmittable = this.checkIfPageIsSubmittable();
        this.submit = this.submitDefault;        

        console.log("this.results.currentExam",this.results.currentExam);
    }

    /** Submit function for exam pages. Can be overwritten by exams.
     * @models results, state
    */
    submit() {
        console.log("ExamService submit() called");
    }    

    skip() {
        console.log("ExamService skip() called");
    }

    back() {
        console.log("ExamService back() called");
    }

    reset() {
        this.state.examState = ExamState.Ready;
    }

    /** Advance to next page in the exam
     * @summary Increments the exam page index. Advances to next page in protocolStack. If there is no next page it will
     * search for a followOn. The protocolStack will be updated.
     * @models state
    */
    private advancePage() {
        let nextExamIndex = this.state.examIndex + 1;
        var nextID;
        if (this.currentPage.followOns) { 
            nextID = this.findFollowOn();
            if (nextID != undefined) {
                if (nextID === "@END_ALL") {
                    this.endExam();
                    return;
                }
                let pages = this.protocolM.protocolModel.activeProtocolDictionary![nextID].pages;
                this.addPagesToStack(pages, nextExamIndex);
            } else {
                this.state.examState = ExamState.NotReady;
            }
        }        
        this.state.examIndex = nextExamIndex;
        this.startPage();
    }

    /** Proceed to next page in the exam
     * @summary The exam will proceed
     * to the correct page.
     * @models state
    */
    private startPage() {
        console.log(this.pageModel.stack[this.state.examIndex]);
        this.currentPage = this.pageModel.stack[this.state.examIndex];
        this.pageModel.currentPageObservable.next(this.currentPage);
        // TODO: Could subscribe to the currentPageObservable...
        this.resultsService.initializePageResults(this.currentPage);
        this.state.isSubmittable = this.checkIfPageIsSubmittable();
    }

    /** Parse page objects and add them to the pageModel.stack.
     * @summary Adds pages to pageModel.stack. This will parse any page with a reference and put the 
     * correct pages in place.
     * @models state, protocol, page
     * @param pages list of page objects
    */
    private addPagesToStack(pages:any, index:number) {
        let extraPages:any;
        pages.forEach( (page:any)=> {
            console.log(page);
            if (page?.reference) {
                extraPages = this.protocolM.protocolModel.activeProtocolDictionary![page?.reference].pages;
                this.addPagesToStack(extraPages, index+1);
            } else if (page.pages) {
                extraPages = page.pages;
                this.addPagesToStack(extraPages,index+1)
            } else {
                this.pageModel.stack.splice(index, 0, page);
                index = index + 1;
            }
        });
    }

    /** Finds followOn from current page.
     * @summary Finds and returns the followOn ID from a page specified from a response.
     * @models state, results
     * @returns followOn ID: string or undefined
    */
    private findFollowOn() {
        let id: string | undefined = undefined;
        this.currentPage.followOns.forEach((followOn:any) => {
            if (this.results.currentPage.response == followOn.conditional.split("==")[1].replaceAll("'","")) {
                id = followOn.target.reference;
            }
        });
        return id;
    }

    /** Checks if a page is submittable.
     * @summary Checks if a page is submittable and returns a boolean
     * @returns boolean if page is submittable
    */
    private checkIfPageIsSubmittable() {
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
    /**
     * End Exam
     * @summary Save current exam results, set exam state, and scroll page back to top.
     * @models state
     */
    private endExam() {
        this.results.currentExam.elapsedTime = calculateElapsedTime(this.results.currentExam.testDateTime!);
        this.resultsService.save(this.results.currentExam);
        this.state.examState = ExamState.Finalized;
        window.scrollTo(0, 0);
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

}