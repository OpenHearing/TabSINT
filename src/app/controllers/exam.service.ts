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

    /* Replacements
    - pm.root => protocol.activeProtocol
    - exam.dm.state.mode => state.examState
    - page.dm => protocol.activeProtocol
    - exam.dm.state.progress => state.examProgress
    - page.result => results.current
    */

    /* Notes:
        - protocolStack contains a list of the following object:
    {
        protocol: thisProtocol,
        startTime: new Date().toJSON(),
        nPagesDone: 0,
        nPagesExpected: 0,
        pageQueue: [],
        pageIndex: 0
    };

    */

    // Definining variables
    // TODO: Should these variables be moved to a model?
    cha = {
        myCha: "",
        streaming: false
    };
    nRemove: any;
    nPages: any;
    gradeResponse: any;
    INHERITABLE_PROPERTIES: any;

    
    switchToAdminView() {
        console.log("ExamService switchToAdminView() called");
    }

    switchToExamView() {
        // hide tasks by default when moving to exam view
        // tasks.hide();

        let finishSwitch: ( () => void ) = () => {
            // Call plugins act
            // plugins.runEvent("switchToExamView", { disk: disk, page: page.dm });

            // TODO: Is this needed?
            // switch the view
            // router.goto("EXAM");

            console.log("this.protocol.activeProtocol",this.protocol.activeProtocol);
            this.testVar = (this.protocol.activeProtocol?.pages?.[this.state.examIndex] as any)?.pages?.[this.state.examIndex];
            console.log("this.testVar",this.testVar);
            console.log("this.state.protocolStack",this.state.protocolStack);
            if (this.protocol.activeProtocol?.pages?.[this.state.examIndex]?.id) {
            // if (testVar?.id) {
                // this.logger.debug("re-activating page " + this.protocol.activeProtocol.id);
                this.logger.debug("re-activating page " + this.testVar?.id);
                this.finishActivate();
            }
        }

        // try loading a protocol from disk.protocol if one is not already available
        if (_.isUndefined(this.protocol.activeProtocol)) {
            this.protocolService
                .load(undefined, this.disk.validateProtocols)
                .then(this.reset)
                .then(finishSwitch)
                .catch( () => {
                    this.notifications.alert(
                        this.translate.instant("No protocol has been loaded. Please scan your QR Code or navigate to the Admin View and load a protocol.")
                    ).subscribe();
                    this.logger.debug("No protocol loaded (or worse problem since this is a WIP)");
                    console.log("Error in switchToExamView promise chain");
                });
        } else {
            finishSwitch();
        }
    }

    // TODO: this function needs major reworking
    finishActivate() {
        console.log("finishActivate called");
        // var previous = JSON.parse(JSON.stringify(this.protocol.activeProtocol));
        // if (JSON.stringify(previous.dm) == JSON.stringify(pg)) {
        //     // reset previous if it is identical to curent. This occurs if switching between admin mode / exam view.
        //     previous = {};
        // }

        // TODO: Below 2 lines are not needed?
        // page.dm = pg;
        // page.result = result;

        this.state.examState = ExamState.Testing;
        console.log("this.state.examState",this.state.examState);
        let streamRunning = false;

        // this.logger.debug("streaming required:" + JSON.stringify(this.page.video || this.page.wavfiles || this.page.chaStream));

        // if (
        //     (this.disk.headset === "Creare Headset" ||
        //     this.disk.headset === "WAHTS" ||
        //     // this.protocol.activeProtocol?.headset === "Creare Headset" ||
        //     this.protocol.activeProtocol?.headset === "WAHTS") &&
        //     (this.page.video || this.page.wavfiles || this.page.chaStream)
        // ) {
        //     if (previous && previous.dm && (previous.dm.video || previous.dm.wavfiles || previous.dm.chaStream)) {
        //         this.logger.debug("Streaming mode should already be running");
        //         streamRunning = true;
        //     } else {
        //         this.page.loadingActive = true;
        //         this.page.loadingRequired = true;
        //         setTimeout( () => {
        //             this.page.loadingActive = false;
        //             this.logger.debug("this.page.loadingActive: "+this.page.loadingActive.toString());
        //         }, bluetoothTimeout);
        //     }
        // } else {
        //     this.page.loadingActive = false;
        //     this.page.loadingRequired = false;
        // }


        // pass in disk and page so they are available to the run functions
        // plugins.runEvent("pageStart", { disk: this.disk, page: page.dm })
        Promise.resolve()
            // .then(async () => {
            //     // cha streaming
            //     if (
            //         (this.disk.headset === "Creare Headset" ||
            //             this.disk.headset === "WAHTS" ||
            //             // this.protocol.activeProtocol?.headset === "Creare Headset" ||
            //             this.protocol.activeProtocol?.headset === "WAHTS") &&
            //             (this.page.video || this.page.wavfiles || this.page.chaStream) &&
            //             (_.isUndefined(this.protocol.activeProtocol?.pages?.[this.state.examIndex]?.responseArea) ||
            //         (!_.isUndefined(this.protocol.activeProtocol?.pages?.[this.state.examIndex]?.responseArea) && this.protocol.activeProtocol?.pages?.[this.state.examIndex]?.responseArea?.['type'] !== "externalAppResponseArea"))
            //     ) {
            //         if (this.cha.myCha) {
            //             if (!this.disk.disableAudioStreaming) {
            //                 // video should get into this one
            //                 if (!this.cha.streaming && !streamRunning) {
            //                     try {
            //                         console.log("exam.service.ts - talkThrough not yet supported");
            //                         // await chaExams.startTalkThrough();
            //                         await new Promise(r => setTimeout(r, 1000));
            //                         // if (!_.isUndefined(page.dm.volumeLevel)) {
            //                         //   tabsintNative.setAudio(null, tabsintNative.onVolumeErr, page.dm.volumeLevel);
            //                         //   console.log("Changing the tablet volume...", page.dm.volumeLevel);
            //                         // }
            //                     } catch (e) {
            //                         this.logger.debug("Could not start TalkThrough exam. Error was:" + e);
            //                     }
            //                 }
            //                 if (this.cha.streaming && !this.getNextPage()) {
            //                     // chaExams.stopTalkThrough();
            //                     console.log("chaExams.stopTalkThrough() called, but it isnt implemented yet");
            //                 }
            //             } else {
            //                 this.notifications.alert(
            //                     this.translate.instant("Audio streaming is currently disabled. Streaming can be enabled in the WAHTS preferences on the Admin page. Please reload the protocol after enabling streaming.")
            //                 ).subscribe();
            //             }
            //         } else {
            //             // notifications.alert("WAHTS is currently disconnected. Please reconnect WAHTS and restart exam.");
            //         }
            //     } else {
            //         // NOTE: this should not return because the promise gets conflicted with
            //         // the cha-response-areas controller
            //         this.results.current.responseStartTime = new Date();
            //         // await chaExams.reset();
            //     }
            // })

            // page setup functions
            .then( () => {
                // Start response timer
                this.results.current.responseStartTime = new Date();

                // If previous page was scrolled down this page will be too, scroll back to top - starting at the bottom is annoying!
                window.scrollTo(0, 0);
            })
            .then( () => {
                // if (!this.page.loadingActive) {
                //     this.finishActivateMedia();
                // }
            });
    }

    getNextPage(): boolean {
        // if out of pages in this protocol before incrementing nPages, remove the protocol, but do not keep incrementing in the parent protocol
        if (this.nPages === undefined) {
            this.nPages = 1;
        }
        if (this.currPageQueue() && this.getCurrPageIndex() + this.nPages < this.currPageQueue().length) {
            _.last(this.state.protocolStack).pageIndex += this.nPages;
            return this.getCurrentPage();
        } else {
            this.removeCurrentProtocol(); // recurses until finding a parent protocol that isn't timed out and has pages left
            // if anything is left, return that page here
            if (this.state.protocolStack.length > 0) {
                return this.getNextPage();
            }
        }
        return false;
    }

    getCurrentPage() {
        if (this.currPageQueue() === undefined || this.getCurrPageIndex() === undefined) {
            return false;
        } else {
            return this.currPageQueue()[this.getCurrPageIndex()];
        }
    }

    removeCurrentProtocol() {
        this.nRemove = this.nRemove !== undefined ? this.nRemove : 1;
        //var state = protocolStack.pop();  //BPF commented - state was overwriting parent var!
        for (var i = 0; i < this.nRemove; i++) {
            this.state.protocolStack.pop();
        }
        // We are done; we don't expect any more questions.
        //state.nPagesExpected = state.nPagesDone; //TODO follow this logic - what does this change?

        // if any protocols left
        if (this.state.protocolStack.length > 0) {
            // if no pages left in this protocol, remove this one too
            if (this.getCurrPageIndex() + 1 > this.currPageQueue().length) {
                this.removeCurrentProtocol();
            } else {
                // increment parent protocol pagesDone counter, check timeouts
                this.state.protocolStack[this.state.protocolStack.length - 1].nPagesDone += 1;
                this.checkNPagesBasedTimeouts();
            }
        }
    }

    checkNPagesBasedTimeouts() {
        // Check for Npages-based timeouts (only last protocol in stack has
        // changing # of pages)
        if (this.currProtocol().timeout) {
            if (this.currProtocol().timeout.nMaxPages) {
                var nPagesDone = this.state.protocolStack[this.state.protocolStack.length - 1].nPagesDone;
                if (nPagesDone >= this.currProtocol().timeout.nMaxPages) {
                    // Remove timed out protocol and all child protocols.
                    this.logger.debug("Timed out after " + nPagesDone.toString() + " pages.");
                    if (this.currProtocol().timeout.alert) {
                        this.notifications.alert(
                            this.translate.instant("This (sub)exam has timed out after ") +
                            nPagesDone.toString() +
                            this.translate.instant(" pages.")
                        );
                    }
                    this.removeCurrentProtocol();
                }
            }
        }
    }

    currPageQueue() {
        return this.state.protocolStack.length ? _.last(this.state.protocolStack).pageQueue : undefined;
    }

    getCurrPageIndex() {
        return this.state.protocolStack.length ? _.last(this.state.protocolStack).pageIndex : undefined;
    }

    finishActivateMedia() {
        Promise.resolve()

        // start automatic media
        .then( () => {
            // Start audio files(s) (if applicable):
            if (
                _.isUndefined(this.protocol.activeProtocol?.pages?.[this.state.examIndex]?.responseArea) ||
                (!_.isUndefined(this.protocol.activeProtocol?.pages?.[this.state.examIndex]?.responseArea) && this.protocol.activeProtocol?.pages?.[this.state.examIndex]?.responseArea?.['type'] !== "externalAppResponseArea")
            ) {
                // media.stopAudio();

                // if (!_.isUndefined(this.page.wavfiles)) {
                //     var startDelayTime = !_.isUndefined(this.page.wavfileStartDelayTime)
                //         ? this.page.wavfileStartDelayTime
                //         : 1000; // use default delay of 1000ms if no time specified

                //     var playDelay = 0;

                //     //Volume has already been set above
                //     setTimeout(() => {
                //         // media.playWav(this.page.wavfiles, startDelayTime, true);
                //     }, playDelay);
                // }
            }

            // Video handling
            // if (!_.isUndefined(this.page.video)) {
            //     // tabsintNative.resetAudio(null, tabsintNative.onVolumeErr);

            //     // video object to hold important local information
            //     var video = {
            //         submittable: !this.page.video.noSkip,
            //         elem: undefined
            //     };

            //     // submittable logic only set once here
            //     this.state.isSubmittable = video.submittable;

            //     // setTimeout( () => {
            //     //     video.elem = document.getElementById("video1"); // mobile browsers often disable allowing auto-play.  Autoplay must be set in the html AND play must be called here
            //     //     if (page.dm.video.autoplay) {
            //     //         video.elem.play();
            //     //     }

            //     //     if (page.dm.video.noSkip) {
            //     //         video.elem.addEventListener("ended", () => {
            //     //             // wait until the video has ended to make our local handle false
            //     //             video.submittable = true;
            //     //             this.state.isSubmittable = video.submittable;
            //     //             $rootScope.$apply();
            //     //         });
            //     //     }
            //     // }, 250);
            // }

            // CHA wav file handling
            // if (this.page.chaWavFiles) {
            //     console.log('wavfile not yet supported');
            //     // chaExams.playSound(this.page.chaWavFiles);
            // }
        });
    }
    
    help() {
        console.log("ExamService help() called");
        // if (exam.dm && page.dm && page.dm.helpText) {
        //     notifications.alert(page.dm.helpText);
        // }
    }

    reset() {
        console.log("ExamService reset() called");

        this.logger.debug("Resetting exam");
        // exam.dm.svantekWarned = false;
        // tabsintNative.unregisterUsbDeviceListener(this.usbEventCallback);
        // plugins.runEvent("resetStart");
        // tabsintNative.resetAudio(null, tabsintNative.onVolumeErr);

        // try {
        //     chaExams.reset();
        // } catch (e) {
        //     this.logger.debug("CHA - chaExams.reset failed on exam reset with error: " + JSON.stringify(e));
        // }

        // try {
        //     chaExams.clearStorage();
        // } catch (e) {
        //     // reset placeholders within complex pages
        //     this.logger.debug("CHA - chaExams.clearStorage failed on exam reset with error: " + JSON.stringify(e));
        // }

        // // logger siteid
        // try {
        //     this.logger.param.siteId = disk.protocol.siteId;
        // } catch (e) {
        //     this.logger.warning("Logger failed to set siteId");
        // }

        // reset slm - these methods will immediately return if SLM is not available
        // slm.stop().then(slm.close);

        // stop svantek recording
        // svantek.stop();

        // setup exam
        this.results.current = {};
        // exam.dm.state.iQuestion = 1;
        this.state.examState = ExamState.Ready;
        console.log("this.state.examState",this.state.examState);
        
        this.state.examProgress = {
            pctProgress: 0,
            anticipatedProtocols: [],
            activatedProtocols: []
        };

        // exam.dm.state.flags = {};
        // exam.dm.state.nRepeats = 0;

        // this.page.previous = JSON.parse(JSON.stringify(this.page.current));
        // this.page.current = {};

        // if (this.disk.externalMode) {
        //     // this.page.current = externalControlMode.resetExternal(startPage);
        // } else {
        //     this.page.current = this.resetInternal();
        // }

        // if (!this.page.current) {
        //     return;
        // }

        // TODO: Should this happen somewhere else?
        // page.dm = {
        //     title: pg.title,
        //     subtitle: pg.subtitle,
        //     instructionText: pg.instructionText,
        //     helpText: pg.helpText,
        //     isSubmittable: true
        // };

        // // perform asynchronous loading  when app is ready
        // return app
        //     .ready()
        //     .then( () => {
        //     if (pm.root._hasSubjectIdResponseArea) {
        //             return subjectHistory.load().then( () => {
        //             exam.dm.state.flags.subjectHistory = subjectHistory.data;
        //         });
        //     }
        //     })
        //     .finally( () => {
        //         plugins.runEvent("resetEnd");
        //     });
        return Promise.resolve
    }

    resetInternal() {
        if (!this.protocol.activeProtocol) {
            this.state.examState = ExamState.NotReady;
            console.log("this.state.examState",this.state.examState);
            return false;
        }
  
        // load protocol
        // this.protocolService.reset();
        this.state.protocolStack.splice(0, this.state.protocolStack.length); // reset/empty it.
  
        // prepare progress tracking structures.
        if (this.protocol.activeProtocol) {
            // TODO: VAL to rewrite this into protocol service
            this.fillAnticipatedProtocols(this.protocol.activeProtocol);
            this.activateNewProtocol(this.protocol.activeProtocol);
        } else {
            this.state.examState = ExamState.NotReady;
            console.log("this.state.examState",this.state.examState);
            return false;
        }
  
        // Set up 'instruction' page.
        return this.currProtocol(); // shortcut
    }

    currProtocol() {
        /* Convenience fxn to get current protocol. Undefined if stack is empty. */
        return this.state.protocolStack.length ? _.last(this.state.protocolStack).protocol : undefined;
    }

    // ESSENTIAL?
    activateNewProtocol(thisProtocol:any) {
        var state:any = {
            protocol: thisProtocol,
            startTime: new Date().toJSON(),
            nPagesDone: 0,
            nPagesExpected: 0,
            pageQueue: [],
            pageIndex: 0
        };
  
        if (thisProtocol.exclusiveTimingMode) {
          this.fillAnticipatedProtocols(thisProtocol);
        }
  
        switch (thisProtocol.randomization) {
            case undefined:
                state.pageQueue = _.clone(thisProtocol.pages);
                break;
            case "WithoutReplacement":
                state.pageQueue = _.shuffle(thisProtocol.pages); // always randomize all pages in the sub protocol
                break;
            default:
                this.logger.error("Undefined randomization type: " + JSON.stringify(thisProtocol.randomization));
        }
  
        // push onto protocol stack.
        this.state.protocolStack.push(state);
  
        // for progress calculation, add protocol to activated protocols list and
        // remove from anticipated protocols list.
        this.state.examProgress.activatedProtocols.push(state);
        if (thisProtocol.protocolId) {
            this.state.examProgress.anticipatedProtocols = _.reject(this.state.examProgress.anticipatedProtocols, (container) => {
                return container.protocolId === thisProtocol.protocolId;
            });
        }
    }

    // ESSENTIAL?
    fillAnticipatedProtocols(protocol:any) {
        // clear the list.
        this.state.examProgress.anticipatedProtocols = [];
  
        // Recurse through the whole structure and add each
        // protocol to the anticipated list.
        var container, applicablePageLimits;
        let _populateList: ( (protocol:any) => void ) = () => {
            // ignore anything without a protocol ID:
            if (protocol.protocolId) {
                applicablePageLimits = [protocol.pages.length];
                if (protocol.timeout) {
                    if (protocol.timeout.nMaxSeconds) {
                        // applicablePageLimits.push(protocol.timeout.nMaxSeconds / exam.APPROX_TIME_PER_PAGE);
                    }
                    if (protocol.timeout.nMaxPages) {
                        applicablePageLimits.push(protocol.timeout.nMaxPages);
                    }
                }
    
                container = {
                    nPagesExpected: _.min(applicablePageLimits),
                    protocolId: protocol.protocolId
                };
  
                this.state.examProgress.anticipatedProtocols.push(container);
            }
  
            if (_.has(protocol, "subProtocols")) {
                _.forEach(protocol.subProtocols, function(obj) {
                    _populateList(obj);
                });
            }
    
            if (_.has(protocol, "pages")) {
                _.forEach(protocol.pages, function(obj) {
                    if (_.has(obj, "protocolId")) {
                        _populateList(obj);
                    }
                });
            }
        }
        _populateList(protocol);
    }

    submit() {
        // This seems to be overwritten by submitDefault. Need to figure out a good way to do that.
        console.log("ExamService submit() called");
    }

    back() {
        console.log("ExamService back() called");
    }

    closeAll() {
        console.log("ExamService closeAll() called");
    }

    skip() {
        this.logger.debug("Skipping Page");
        this.results.current.isSkipped = true;
        this.state.isSubmittable = true;
        this.submit = this.submitDefault;
        this.submit();
    }

    submitDefault() {
        console.log("ExamService submitDefault() called");

        this.state.isSubmittable = this.getSubmittableLogic(this.protocol.activeProtocol?.pages?.[this.state.examIndex]?.responseArea);
  
        // if not ready to submit, alert with error and just return.
        if (!this.state.isSubmittable) {
          this.logger.warning("Page is not submittable");
          return;
        }
  
        return this.finishPage()
            .then( () => this.pushResults()) // save the current result and reset temp result object (page.result)
            .then( () => {
                // if (this.page.chaWavFiles && chaExams.state === "Playing") {
                //     // chaWavFile still playing. Clear interval in examLogic.
                //     return clearInterval(chaExams.playsoundInterval);
                // }
            })
            // TODO: Do we want to include the externalControlMode?
            .then( () => {
                if (this.disk.externalMode) {
                    // externalControlMode.submitExternal();
                } else {
                    this.submitInternal();
                }
            });
    };

    submitInternal() {
        console.log("ExamService submitInternal() called");

        // This Section Works With The animate-switch-container and animate-switch.
        // a bit of a hack, using 2 exam pages (exactly the same) and flipping between them to trigger a switch slide
        // if (page.dm.showFeedback === undefined) {
        //     startPageTransition(finishSubmit); // stop audio, transition
        // } else {
        //     startPageTransition(function() {
        //         page.dm.showFeedback();
        //         $timeout(function() {
        //             finishSubmit();
        //         }, 1250);
        //     });
        // }
        this.finishSubmit();
    }

    finishSubmit() {
        console.log("finishSubmit in exam service called");

        // exam.dm.state.displayMode = "ENABLED";
        // var i;
  
        // Add pages done
        // this.state.protocolStack[this.state.protocolStack.length - 1].nPagesDone += 1;
  
        // count it as a question if the answer is not undefined...
        if (this.results.current.response !== undefined) {
            //   exam.dm.state.iQuestion += 1;
            console.log("count it as a question if the answer is not undefined... ???");
        }
  
        // re-initialize the result to undefined
        // page.result = undefined;
  
        // this.checkTimeouts(); // will remove a protocol if timed out based on nPages or actual time
  
        // Set any flags...  Use page.dm, even if that means we will use flags from a time out page.
        // if (page.dm.setFlags) {
        //   _.forEach(page.dm.setFlags, function(setFlag) {
        //     if (_.isUndefined(setFlag.conditional)) {
        //       exam.dm.state.flags[setFlag.id] = true;
        //     } else {
        //       exam.dm.state.flags[setFlag.id] = evalConditional(setFlag.conditional);
        //     }
        //   });
        // }
  
        // check for repeat logic - Note - cannot use page.dm, in case we timed out already.  Use exam.getCurrentPage()
        // if (this.getCurrentPage().repeatPage !== undefined) {
        //     // does it have repeat logic
    
        //     var r = this.getCurrentPage().repeatPage;
        //     r.nRepeats = !_.isUndefined(r.nRepeats) ? r.nRepeats : 2; // cap number of repeats
    
        //     if (exam.dm.state.nRepeats < r.nRepeats) {
        //         // check number of repeats
        //         if ((r.repeatIf !== undefined && evalConditional(r.repeatIf)) || r.repeatIf === undefined) {
        //             if (this.activatePage(this.getCurrentPage())) {
        //                 // just feed the same page in again
        //                 exam.dm.state.nRepeats++;
        //                 this.logger.info("Repeating the page, nRepeats = " + exam.dm.state.nRepeats);
        //                 return;
        //             }
        //         } else {
        //             exam.dm.state.nRepeats = 0; // The repeatIf condition was not true: finished repeating, so reset the counter
        //         }
        //     } else {
        //         exam.dm.state.nRepeats = 0; // finished repeating
        //     }
        // } else {
        //     exam.dm.state.nRepeats = 0; // repeats only work for a page - they are not saved once you navigate somewhere else, like a subprotocol
        // }
  
        // Do a follow-on, if applicable.
        console.log("this.testVar?.followOns",this.testVar?.followOns);
        if (this.testVar?.followOns) {
            console.log("follow on found, proceeding");
            for (let i = 0; i < (this.testVar?.followOns as any).length; i++) {
                var followOn = this.testVar?.followOns[i];
                console.log("followOn", followOn);
                if (_.isUndefined(followOn.conditional) || this.evalConditional(followOn.conditional)) {
                    try {
                        var activationSuccess = this.activatePage(followOn.target);
                        // TODO: THIS IS A HACK THAT SHOULD BE CHANGED
                        // instead we should go to this.protocol.activeProtocol?.subProtocols?.[CORRECT_ID]?.pages?.[0];
                        this.testVar = this.protocol.activeProtocol?.subProtocols?.[0]?.pages?.[0];
                        console.log("this.testVar",this.testVar);
                        console.log("this.state.protocolStack",this.state.protocolStack);

                        if (activationSuccess) {
                            return;
                        }
                    } catch (err:any) {
                        // notifications.alert(
                        //     err.toString() +
                        //         "\n\n" +
                        //         gettextCatalog.getString(
                        //         "Please alert an administrator. Unfortunately, this exam cannot be completed. Reset the exam to try again."
                        //         )
                        //     );
                        this.logger.error("In submit() followOns.  Details: " + err.toString());
                    }
                }
            }
        }
  
        // Otherwise, go to the next page in the list (if there is one)...
        if (this.activatePage(this.getNextPage())) {
          return;
        }
  
        // If there are no pages left, finalize the exam
        this.finalize();
    }

    evalConditional(conditional:any, locals?:any) {
        locals = locals || {};
        var ret;
  
        // _.extend(locals, {
        //     _: _,
        //     arrayContains: (strArray:any, item:any) => {
        //         return _.includes(JSON.parse(strArray), item);
        //     },
        //     getPresentation: (presId:any) => {
        //         return _.filter(this.results.current.testResults?.responses, function(res) {
        //         return res.presentationId === presId;
        //         })[0];
        //     },
        //     getLastPresentation: (presId:any) => {
        //         return _.filter(this.results.current.testResults?.responses, function(res) {
        //         return res.presentationId === presId;
        //         }).pop();
        //     },
        //     // flags: JSON.parse(JSON.stringify(exam.dm.state.flags)),
        //     result: JSON.parse(JSON.stringify(_.last(this.results.current.testResults?.responses))),
        //     examResults: JSON.parse(JSON.stringify(this.results.current)),
        //     Math: Math,
        //     JSON: JSON
        // });
  
        // Co-opting AngularJS's eval because it's so much safer than native javascript eval.
        try {
            // ret = $rootScope.$new().$eval(conditional, locals);
            ret = true;
        } catch (err) {
            // notifications.alert(
            //     gettextCatalog.getString("There is an error in this page's conditional in the exam protocol") +
            //     ": \n\n" +
            //     err.toString() +
            //     "\n\n" +
            //     gettextCatalog.getString("The conditional is: \n\t") +
            //     conditional
            // );
            console.log("error in evalCondition() ???");
            ret = false;
        }
        return ret;
    }

    finalize() {
        // media.stopAudio(); // Make sure Audio is stopped.

        // Calculating the exam elapsed time.  Could probably be simpler!
        var stopTime:any = new Date();
        var startTime:any = new Date(JSON.parse('"' + this.results.current.testDateTime + '"'));
        var diff = Math.abs(stopTime - startTime); // in ms
        diff /= 1000; //throw away ms
        var dDays = Math.floor(diff / (24 * 60 * 60));
        diff = diff % (24 * 60 * 60);
        var dHours = Math.floor(diff / (60 * 60));
        diff = diff % (60 * 60);
        var dMinutes = Math.floor(diff / 60);
        diff = diff % 60;
        var dSeconds = Math.floor(diff);

        var sDays = dDays < 10 ? "0" + dDays : "" + dDays;
        var sHours = dHours < 10 ? "0" + dHours : "" + dHours;
        var sMinutes = dMinutes < 10 ? "0" + dMinutes : "" + dMinutes;
        var sSeconds = dSeconds < 10 ? "0" + dSeconds : "" + dSeconds;

        this.results.current.elapsedTime = sHours + ":" + sMinutes + ":" + sSeconds;

        for (var i = 0; i < this.results.current.testResults.responses.length; i++) {
            var response = this.results.current.testResults.responses[i];
            this.results.current.nResponses += 1;

            if (typeof response.correct === "string") {
                if (_.includes(JSON.parse(response.correct), false)) {
                    this.results.current.nIncorrect += 1;
                } else {
                    this.results.current.nCorrect += 1;
                }
            } else if (response.correct === true) {
                this.results.current.nCorrect += 1;
            } else if (response.correct === false) {
                this.results.current.nIncorrect += 1;
            }
        }

        // finalize
        // page.dm = {
        //     id: undefined,
        //     title: pm.root.title,
        //     subtitle: pm.root.subtitle,
        //     instructionText: "",
        //     helpText: ""
        // };

        // evaluate custom result export filename if included
        if (this.protocol.activeProtocol?.resultFilename) {
            let filename = this.protocol.activeProtocol?.resultFilename;
            let interpretedFilename;

            // see evalConditional for local names (copied directly)
            let locals = {
            _: _, // underscore library
            arrayContains: (strArray:any, item:any) => {
                return _.includes(JSON.parse(strArray), item);
            },
            getPresentation: (presId:any) => {
                return _.filter(this.results.current.testResults.responses, function(res) {
                return res.presentationId === presId;
                })[0];
            },
            getLastPresentation: (presId:any) => {
                return _.filter(this.results.current.testResults.responses, function(res) {
                return res.presentationId === presId;
                }).pop();
            },
            // flags: JSON.parse(JSON.stringify(exam.dm.state.flags)),
            result: JSON.parse(JSON.stringify(_.last(this.results.current.testResults.responses))),
            examResults: JSON.parse(JSON.stringify(this.results.current)),
            Math: Math
            };

            // use $eval on filename in case it is a conditional expression
            try {
                // interpretedFilename = $rootScope.$new().$eval(filename, locals);

                // if the interpretedFilename evaluates to undefined, set it equal to the protocol resultFilename field string
                if (!interpretedFilename) {
                    interpretedFilename = filename;
                }

                if (typeof interpretedFilename !== "string") {
                    throw "Filename is not a string";
                }
            } catch (err) {
                // interpretedFilename = devices.shortUUID;
                // notifications.alert(
                //     gettextCatalog.getString("TabSINT failed to evaluate the export filename for this result with error:") +
                //     "\n\n" +
                //     err.toString() +
                //     "\n\n" +
                //     gettextCatalog.getString("This result will be exported with the device uuid as the filename")
                // );
            }

            // save evaluated filename to disk results
            // results.current.resultFilename = interpretedFilename;
        }

        // results.save(results.current);
        this.disk.currentResults = undefined; // can reset this now - we have generated a proper result

        // page.result = undefined;
        this.state.examState = ExamState.Finalized;
        // If previous page was scrolled down this page will be too, scroll back to top - starting at the bottom is annoying!
        window.scrollTo(0, 0);
        // noSleep.allowSleepAgain();
    }


    pushResults() {
        console.log("ExamService pushResults() called");
        this.results.previous = JSON.parse(JSON.stringify(this.results.current));
        this.results.current = {};
    }

    finishPage() {
        console.log("ExamService finishPage() called");
        return Promise.resolve();
    }

    getSubmittableLogic(responseArea:any) {
        // Determine page submission logic.
        if (_.isUndefined(responseArea)) {
            return true;
        } else {
            if (_.isUndefined(responseArea) || responseArea.responseRequired === false) {
                return true;
            } else {
                console.log("this.results.current",this.results.current);
                if (!_.isUndefined(this.results.current)) {
                    if (responseArea.type === "qrResponseArea") {
                        if (this.results.current.qrString) {
                            return true;
                        } else {
                            return false;
                        }
                    } else if (responseArea.type === "likertResponseArea") {
                        if (!_.isUndefined(this.results.current.response) ? this.results.current.response[0] !== undefined : false) {
                            return true;
                        } else {
                            return false;
                        }
                    } else if (responseArea.type === "audiometryInputResponseArea") {
                        if (
                            this.results.current.response === undefined ||
                            (_.isEmpty(this.results.current.response.right) && _.isEmpty(this.results.current.response.left))
                        ) {
                            return false;
                        } else {
                            return true;
                        }
                    } else if (
                        this.results.current.response !== undefined &&
                        this.results.current.response !== "[]" &&
                        this.results.current.response !== ""
                        ) {
                        return true;
                    } else {
                        return false;
                    }
                } else {
                    return false;
                }
            }
        }
    }

    begin() {
        console.log("ExamService begin() called");

        // exam.dm.svantekWarned = false;
        // if (pm.root.headset === "EPHD1") {
        //     tabsintNative.registerUsbDeviceListener(exam.usbEventCallback);
        // } else {
        //     tabsintNative.unregisterUsbDeviceListener(exam.usbEventCallback);
        // }

        // if (pm.root.headset === "EPHD1" && pm.root.protocolUsbCMissing) {
        //     notifications.alert(
        //     "The Essential EPHD1 USB-C headset must be used with this protocol. Please plug the headset in and restart the exam."
        //     );
        //     return;
        // }

        // check to see how much memory is left on disk
        if (JSON.stringify(this.disk).length > 8000000) {
            this.notifications.alert(
                this.translate.instant(
                    "The tablet's storage space is too low to continue. Please upload exams as soon as possible to avoid data loss."
                )
            );
            this.logger.error("Memory maxed at 8M");
            return;
        } else if (JSON.stringify(this.disk).length > 2000000) {
            this.notifications.alert(
                this.translate.instant(
                    "The tablet's storage space is getting low. Please upload exams as soon as possible to avoid data loss."
                )
            );
            this.logger.warning("Warned memory low");
        }

        // turn screen sleep off
        // noSleep.keepAwake();

        // reset audio
        // tabsintNative.resetAudio(null, tabsintNative.onVolumeErr);

        // switch exam state displayMode
        // exam.dm.state.displayMode = "DISABLED";
        // $timeout(function() {
        //     exam.dm.state.displayMode = "ENABLED";
        // }, 150);

        // initialize examResults
        // results.create();

        // delete repo field from gitlab protocols - way too verbose
        // if (this.results.current.testResults.protocol.repo) {
        //     delete this.results.current.testResults.protocol.repo;
        // }

        // initialize temp storage of current test results
        this.disk.currentResults = JSON.parse(JSON.stringify(this.results.current)); // load all the fields into the temp storage option

        // get the current position and save it in the results
        // tabletLocation.updateCurrentPosition().then(function() {
        //     if (angular.isDefined(results.current)) {
        //     results.current.tabletLocation = disk.tabletLocation; // if position is not updated, this value will be the same as before
        //     }
        // });

        this.logger.debug(
            `Beginning exam on tablet UUID: ${this.results?.current?.testResults?.tabletUUID} at Location: ${Object.hasOwnProperty(
                this.results?.current?.testResults?.tabletUUID
            )}`
        );

        if (this.disk.externalMode) {
            // externalControlMode.getExternalPage();
        } else {
            this.activatePage(this.getCurrentPage());
        }
    }

    activatePage(pg:any) {
        /*
        Cancel timerPromise before it auto submits.
        */
        // try {
        //     $timeout.cancel(timerPromise);
        // } catch {}

        // get the default submit function to start (in case it was overriden)
        this.submit = this.submitDefault;

        // reset immersive mode
        // androidFullScreen.immersiveMode();

        // Make sure Audio is stopped.
        // media.stopAudio();

        // reset the page response area to undefined to trigger controller
        // page.dm.responseArea = undefined;

        // reset the gradeResponse function to the default
        this.gradeResponse = this.gradeResponseDefault;

        // resolve page references
        // pg = _resolvePage(pg);
        // if (!pg) {
        //     return false;
        // }

        // copy so we can add properties safely.
        // pg = JSON.parse(JSON.stringify(pg));

        // default property for autoSubmit
        //checkbox response area should default to false if responseRequired undefined, HG 2/28/19
        // if (!_.isUndefined(pg.responseArea)) {
        //     if (pg.responseArea.type === "checkboxResponseArea") {
        //     pg.responseArea.responseRequired = !_.isUndefined(pg.responseArea.responseRequired)
        //         ? pg.responseArea.responseRequired
        //         : false;
        //     }
        // }

        // Iterate from child to root protocols, applying any missing fields.
        for (var i = this.state.protocolStack.length - 1; i >= 0; i--) {
            _.defaults(pg, _.pick(this.state.protocolStack[i].protocol, this.INHERITABLE_PROPERTIES));
        }

        // run preprocessing function if available, before all the updates to canGoBack, isSubmittable, progress, etc.
        if (pg.preProcessFunction) {
            var passIn = {
                result: JSON.parse(JSON.stringify(_.last(this.results.current.testResults.responses))),
                examResults: JSON.parse(JSON.stringify(this.results.current)),
                page: JSON.parse(JSON.stringify(pg)),
                // flags: exam.dm.state.flags
            };

            // if (_.has(advancedProtocol.registry, pg.preProcessFunction)) {
            //     pg.changedFields = advancedProtocol.run(pg.preProcessFunction, passIn);
            // } else {
            //     this.logger.error(
            //         "The protocol referenced function " +
            //         pg.preProcessFunction +
            //         " but this function does not exist in the functionRegistry."
            //     );
            //     this.notifications.alert(
            //         gettextCatalog.getString("The protocol referenced pre-processing function ") +
            //         pg.preProcessFunction +
            //         gettextCatalog.getString(
            //             ", but this function was not found in the registry. Please check the TabSINT documentation to confirm the function is properly defined"
            //         )
            //     );
            // }

            // apply diff from changed fields
            if (pg.changedFields) {
                // hack to show no page based on preprocess function, and instead move on to next page in protocol
                // if (pg.changedFields === "@SKIP") {
                //     return this.activatePage(this.getNextPage());
                // } else {
                //     this.applyDiff(pg);
                // }
            }
        }

        // integrate SLM into page logic. If the SLM field is on page, we pass that the slm service to handle.
        // SLM is closed in `finishPage()`
        // if (pg.slm) {
        //     slm.init(pg);
        // }

        // activate svantek if defined at page level
        // if (pg.svantek) {
        //     if (svantek.device) {
        //     svantek.start();
        //     } else {
        //     logger.warn("A Svantek dosimeter is not connected, no Svantek data will be collected.");
        //     if (!exam.dm.svantekWarned) {
        //         notifications.alert(
        //         gettextCatalog.getString("A Svantek dosimeter is not connected, no Svantek data will be collected.")
        //         );
        //         exam.dm.svantekWarned = true;
        //     }
        //     }
        // }

        // auto-submit pages after a delay
        // if (angular.isDefined(pg.autoSubmitDelay) && pg.autoSubmitDelay >= 50) {
        //     timerPromise = $timeout(function() {
        //     pg.isSubmittable = true;
        //     exam.submit();
        //     }, pg.autoSubmitDelay);
        // }

        // Determine page back button logic
        this.state.canGoBack = function() {
            // make sure its not the first page
            // var notTheFirstPage = _.last(this.state.protocolStack).pageIndex > 0;

            // // Detect inline page follow-on's by noting when the current page does not match what the protocol stack expects it to be.
            // var notInASinglePageFollowOn = _.last(this.state.protocolStack).pageQueue[_.last(this.state.protocolStack).pageIndex].id === pg.id;

            // // Detect when the previous page isn't what we expect it to be.
            // var previousPageMatches = false;
            // if (results.current) {
            // var previousResult = _.last(results.current.testResults.responses);
            // var expectedPreviousPage = _.last(this.state.protocolStack).pageQueue[_.last(this.state.protocolStack).pageIndex - 1];
            // previousPageMatches =
            //     previousResult && expectedPreviousPage && previousResult.presentationId === expectedPreviousPage.id;
            // }

            // return pg.enableBackButton && notTheFirstPage && previousPageMatches && notInASinglePageFollowOn;
        };

        // Determine page submission logic.
        // pg.isSubmittable = this.getSubmittableLogic(pg.responseArea);

        // initialize callback
        // pg.showFeedback = undefined;

        // Re-calculate pct progress.
        // var nPagesDone = 0,
        //     nPagesTotal = 0;
        // _.forEach(exam.dm.state.progress.anticipatedProtocols, function(container) {
        //     nPagesTotal += container.nPagesExpected;
        // });
        // _.forEach(exam.dm.state.progress.activatedProtocols, function(state) {
        //     var applicablePageLimits = [state.pageQueue.length];
        //     if (state.protocol.timeout) {
        //     if (state.protocol.timeout.nMaxSeconds) {
        //         var remainingSeconds = state.protocol.timeout.nMaxSeconds - (new Date() - state.startTime) / 1000;
        //         remainingSeconds = _.max([0, remainingSeconds]);
        //         applicablePageLimits.push(Math.ceil(remainingSeconds / exam.APPROX_TIME_PER_PAGE));
        //     }
        //     if (state.protocol.timeout.nMaxPages) {
        //         applicablePageLimits.push(state.protocol.timeout.nMaxPages - state.nPagesDone);
        //     }
        //     }
        //     state.nPagesExpected = state.nPagesDone + _.min(applicablePageLimits);
        //     nPagesDone += state.nPagesDone;
        //     nPagesTotal += state.nPagesExpected;
        // });

        // var newProgressEstimate = (100 * nPagesDone) / (nPagesTotal + 1);
        // newProgressEstimate = _.min([100, _.max([0, newProgressEstimate])]); // must be between 0 and 100.

        // set page progress bar
        // if (pg.progressBarVal) {
        //     this.state.examProgress.pctProgress = pg.progressBarVal;
        // } else {
        //     this.state.examProgress.pctProgress = newProgressEstimate;
        // }

        // Create new result.
        // var result = results.default(pg);

        setTimeout( () => {
            this.finishActivate();
        }, 20);

        return true;
    }

    gradeResponseDefault() {
        // if (page.dm.responseArea.choices) {
        //     gradeResponses(page.dm.responseArea.choices);
        // } else if (page.dm.responseArea.hotspots) {
        //     gradeResponses(page.dm.responseArea.hotspots);
        // } else if (page.dm.responseArea.correct) {
        //     page.result.correct = page.result.response === page.dm.responseArea.correct;
        // }
    };

    centerIfShort(id:string) {
        if (
          document.getElementById(id) &&
          (document.getElementById(id) as HTMLElement).offsetWidth > 0.8 * document.documentElement.clientWidth
        ) {
          return { "text-align": "left" };
        } else {
          return
        }
    };

}