import * as _ from 'lodash';
import { Injectable } from '@angular/core';

import { ResultsService } from './results.service';
import { Logger } from '../utilities/logger.service';

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
import { ProtocolSchemaInterface } from '../interfaces/protocol-schema.interface';
import { FollowOnInterface, PageDefinition, ProtocolReferenceInterface } from '../interfaces/page-definition.interface';
import { isPageDefinition, isProtocolReferenceInterface, isProtocolSchemaInterface } from '../guards/type.guard';

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
        public logger: Logger,
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
        this.addPagesToStack(this.protocol.activeProtocol?.pages!, 0);
        this.resultsService.initializeExamResults();
        this.startPage();
        this.state.examState = ExamState.Testing;
    }

    /** Default submit function for exam pages.
     * @summary Appends current page results to current exam results, calls advancePage(), and resets.
     * @models results, state
    */
    submitDefault() {
        this.resultsService.pushResults(this.results.currentPage);
        // TODO: The below line might need to be async and awaited
        this.advancePage();

        this.state.isSubmittable = this.checkIfPageIsSubmittable();
        this.submit = this.submitDefault;        

        this.logger.debug("this.results.currentExam: "+JSON.stringify(this.results.currentExam));
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
        // make diagram to explain this
        let nextExamIndex = this.state.examIndex + 1;
        this.setFlags();
        let pageList = this.getPagesFromAdvancedLogic();
        if (pageList!=undefined) {
            if (pageList.length>0) {
                this.addPagesToStack(pageList, nextExamIndex);
            }
            this.state.examIndex = nextExamIndex;
            this.startPage();
        }   
    }

    /** Grabs all pages necessary from advanced logic (skips, repeats, followOns, preprocess)
     * @summary The exam will proceed to the correct page.
     * @models page
    */
    private getPagesFromAdvancedLogic() {
        var pageList: (ProtocolSchemaInterface | PageDefinition | ProtocolReferenceInterface)[] = [];
        if (this.currentPage.skipIf) { 
            this.logger.debug("skipIf is not yet supported");
            // push pages to list if needed
        } if (this.currentPage.repeatPage) {
            this.logger.debug("repeatPage is not yet supported");
            // push pages to list if needed
        } if (this.currentPage.followOns) { 
            let nextID = this.findFollowOn();
            if (nextID != undefined) {
                // TODO: Make it clear that this will break out of the function chain
                // will end the exam if its called
                if (this.checkForSpecialReference(nextID)) {
                    this.handleSpecialReferences(nextID);
                    return undefined
                } else {
                    (this.protocolM.protocolModel.activeProtocolDictionary![nextID].pages as (ProtocolSchemaInterface | PageDefinition | ProtocolReferenceInterface)[]).forEach( 
                        (page: ProtocolSchemaInterface | PageDefinition | ProtocolReferenceInterface) => { 
                            pageList.push(page);
                    });
                }
            }
        } if (this.currentPage.preProcessFunction) { 
            this.logger.debug("preProcessFunction is not yet supported");
            // push pages to list if needed and/or run preprocess function
        }
        return pageList
    }

    /** Checks for flags and sets them
     * @summary TBD.
    */
    private setFlags() {
        // This function will check if flags need to be set and then set them accordingly.
    }

    /** Checks for special references
     * @summary Returns true/false depending a id contains a special reference
    */
    private checkForSpecialReference(id:String | undefined) {
        var hasSpecialReference = false;
        if (id != undefined && id.includes("@")) {
            hasSpecialReference = true;
        }
        return hasSpecialReference
    }

    /** Handles special references
     * @summary Handles the special references
    */
    private handleSpecialReferences(id:String | undefined) {
        if (id === "@PARTIAL") {
            this.endExam();
            this.logger.debug("@PARTIAL not implemented, instead using @END_ALL");
            return;
        } else if (id === "@END_ALL") {
            this.endExam();
            return;
        }
    }

    /** Proceed to next page in the exam
     * @summary The exam will proceed
     * to the correct page.
     * @models state
    */
    private startPage() {
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
    private addPagesToStack(
        pages: (ProtocolSchemaInterface | PageDefinition | ProtocolReferenceInterface)[], 
        index:number
    ) {
        let extraPages: (ProtocolSchemaInterface | PageDefinition | ProtocolReferenceInterface)[];
        pages.forEach( (page: ProtocolSchemaInterface | PageDefinition | ProtocolReferenceInterface)=> {
            if (isProtocolReferenceInterface(page)) {
                extraPages = this.protocolM.protocolModel.activeProtocolDictionary![page?.reference].pages;
                this.addPagesToStack(extraPages, index+1);
            } else if (isProtocolSchemaInterface(page)) {
                extraPages = page.pages;
                this.addPagesToStack(extraPages,index+1)
            } else if (isPageDefinition(page)) {
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
        this.currentPage.followOns?.forEach((followOn: FollowOnInterface) => {
            // TODO: This should be updated to use eval
            if (this.results.currentPage.response == followOn.conditional.split("==")[1].replaceAll("'","")) {
                // TODO: handle if target is protocol or page
                if (isProtocolReferenceInterface(followOn.target)) {
                    id = followOn.target.reference;                
                }
            }
        });
        return id;
    }

    /** Checks if a page is submittable.
     * @summary Checks if a page is submittable and returns a boolean
     * @returns boolean if page is submittable
    */
    private checkIfPageIsSubmittable() {
            return !this.currentPage.responseArea!.responseRequired;

            //TODO: set response requited to false if response area is multipleChoiceResponseArea
            // if (this.currentPage.responseArea.type == "multipleChoiceResponseArea") {
            //     return false
            // } else {
            //     return true
            // }
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