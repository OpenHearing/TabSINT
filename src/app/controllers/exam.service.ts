import { Injectable } from '@angular/core';
import { Subscription } from 'rxjs';

import { isPageDefinition, isProtocolReferenceInterface, isProtocolSchemaInterface } from '../guards/type.guard';
import { PageTypes } from '../types/custom-types';

import { FollowOnInterface } from '../interfaces/page-definition.interface';
import { ResultsInterface } from '../models/results/results.interface';
import { StateInterface } from '../models/state/state.interface';
import { ProtocolModelInterface } from '../models/protocol/protocol.interface';
import { PageInterface } from '../models/page/page.interface';

import { ResultsService } from './results.service';
import { ResultsModel } from '../models/results/results-model.service';
import { StateModel } from '../models/state/state.service';
import { ProtocolModel } from '../models/protocol/protocol-model.service';
import { PageModel } from '../models/page/page.service';

import { DialogType, ExamState } from '../utilities/constants';
import { Notifications } from '../utilities/notifications.service';
import { Logger } from '../utilities/logger.service';
import { calculateElapsedTime } from '../utilities/exam-helper-functions';
@Injectable({
    providedIn: 'root',
})

export class ExamService {
    protocol: ProtocolModelInterface;
    results: ResultsInterface;
    state: StateInterface;
    currentPage: PageInterface;
    pageSubscription: Subscription | undefined;

    constructor (
        private readonly logger: Logger,
        private readonly resultsService: ResultsService,
        private readonly resultsModel: ResultsModel,
        private readonly pageModel: PageModel,
        private readonly protocolM: ProtocolModel,
        private readonly stateModel: StateModel,
        private readonly notifications: Notifications
    ) {
        this.results = this.resultsModel.getResults();
        this.currentPage = this.pageModel.getPage();
        this.pageSubscription = this.pageModel.currentPageSubject.subscribe( (updatedPage: PageInterface) => {
            this.currentPage = updatedPage;
        });
        this.state = this.stateModel.getState();
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
        
        this.advancePage();

        this.state.isSubmittable = this.checkIfPageIsSubmittable();
        this.submit = this.submitDefault;        

        this.logger.debug("this.results.currentExam: "+JSON.stringify(this.results.currentExam));
    }

    /** Submit function for exam pages. Can be overwritten by exams.
     * @models results, state
    */
    submit() {
        this.submitDefault();
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

    submitPartial() {
        this.currentPage.followOns = [{
            conditional: "true",
            target: { reference: "@PARTIAL"}
        }];
        this.submit();
    }

    navigateToTarget(subProtocolID: string) {
        // TODO: returnHereAfterward NOT IMPLEMENTED
        this.currentPage.followOns = [{
            conditional: "true",
            target: {reference: subProtocolID}
        }];
        this.submitDefault();
    }

    /** Advance to next page in the exam
     * @summary Increments the exam page index. Advances to next page in protocolStack. If there is no next page it will
     * search for a followOn. The protocolStack will be updated.
     * @models state
    */
    private advancePage() {
        let nextExamIndex = this.state.examIndex + 1;
        this.setFlags();
        let pageList = this.getPagesFromAdvancedLogic();
        if (pageList!=undefined) {
            if (pageList.length>0) {
                this.addPagesToStack(pageList, nextExamIndex);
            }
            // make sure there are more pages, if not end the exam
            if (this.pageModel.stack.length > nextExamIndex) {
                this.state.examIndex = nextExamIndex;
                this.startPage();
            } else {
                this.endExam();
            }
            
        }   
    }

    /** Grabs all pages necessary from advanced logic (skips, repeats, followOns, preprocess)
     * @summary The exam will proceed to the correct page.
     * @models page
    */
    private getPagesFromAdvancedLogic() {
        let pageList: (PageTypes)[] = [];
        if (this.currentPage.skipIf) { 
            this.logger.debug("skipIf is not yet supported");
            // push pages to list if needed
        } 
        if (this.currentPage.repeatPage) {
            this.logger.debug("repeatPage is not yet supported");
            // push pages to list if needed
        } 
        if (this.currentPage.followOns) { 
            let nextID = this.findFollowOn();
            if (nextID != undefined) {
                if (this.checkForSpecialReference(nextID)) {
                    this.handleSpecialReferences(nextID);
                    return undefined
                } else {
                    (this.protocolM.protocolModel.activeProtocolDictionary![nextID].pages).forEach( 
                        (page: PageTypes) => { 
                            pageList.push(page);
                    });
                }
            }
        } 
        if (this.currentPage.preProcessFunction) { 
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
    private checkForSpecialReference(id: string | undefined) {
        let hasSpecialReference = false;
        if (id?.includes("@")) {
            hasSpecialReference = true;
        }
        return hasSpecialReference
    }

    /** Handles special references
     * @summary Handles the special references
    */
    private handleSpecialReferences(id:string | undefined) {
        if (id === "@PARTIAL") {
            this.endExam();
            this.logger.debug("@PARTIAL not implemented, instead using @END_ALL");
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
        this.pageModel.currentPageSubject.next(this.pageModel.stack[this.state.examIndex]);
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
        pages: (PageTypes)[], 
        index:number
    ) {
        let extraPages: (PageTypes)[];
        pages.forEach( (page: PageTypes)=> {
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
            // backward compatibility
            if (followOn.conditional.split("==")[0] == "result.response") {
                followOn.conditional = followOn.conditional.replace("result.response","this.results.currentPage.response");
            }

            if (eval(followOn.conditional)) {
                // TODO: handle if target is protocol or page
                if (isProtocolReferenceInterface(followOn.target)) {
                    id = followOn.target.reference;                
                }
            }
        });
        return id;
    }

    /** Resets the protocol stack and exam index.
     * @summary Resets the protocol stack to an empty array and the exam index to 0.
    */
    private resetProtocolStack() {
        this.pageModel.stack = [];
        this.state.examIndex = 0;
    }

    /** Checks if a page is submittable.
     * @summary Checks if a page is submittable and returns a boolean
     * @returns boolean if page is submittable
    */
    private checkIfPageIsSubmittable() {
            return !this.currentPage.responseArea!.responseRequired;

            //TODO: set response required to false if response area is multipleChoiceResponseArea
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
        this.resetProtocolStack();
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