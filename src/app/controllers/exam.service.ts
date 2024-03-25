import * as _ from 'lodash';
import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Logger } from '../utilities/logger.service';
import { AppState, ExamState } from '../utilities/constants';
import { ResultsInterface } from '../models/results/results.interface';
import { ResultsModel } from '../models/results/results.service';
import { StateInterface } from '../models/state/state.interface';
import { StateModel } from '../models/state/state.service';
import { PageInterface } from '../models/page/page.interface';
import { PageModel } from '../models/page/page.service';
import { ProtocolModelInterface } from '../models/protocol/protocol-model.interface';
import { ProtocolModel } from '../models/protocol/protocol.service';
import { ProtocolService } from './protocol.service';
import { DiskInterface } from '../models/disk/disk.interface';
import { DiskModel } from '../models/disk/disk.service';
import { Notifications } from '../utilities/notifications.service';
@Injectable({
    providedIn: 'root',
})

export class ExamService {
    page: PageInterface;
    protocol: ProtocolModelInterface
    disk: DiskInterface;
    results: ResultsInterface
    state: StateInterface;
    ExamState = ExamState;
    AppState = AppState;
    protocolModel: ProtocolModelInterface;

    constructor (
        public pageModel: PageModel,
        public resultsModel: ResultsModel,
        public protocolService: ProtocolService,
        public protocolM: ProtocolModel,
        public stateModel: StateModel,
        private translate: TranslateService,
        private logger: Logger,
        private diskModel: DiskModel,
        private notifications: Notifications
        ) { 
        this.page = this.pageModel.getPage();
        this.results = this.resultsModel.getResults();
        this.protocolModel = this.protocolM.getProtocolModel();
        this.state = this.stateModel.getState();
        this.disk = this.diskModel.getDisk();
        this.protocol = this.protocolM.getProtocolModel();
    }

    /* Replacements
    - pm.root => protocol.activeProtocol
    - exam.dm.state.mode => state.examState
    - page.dm => protocol.activeProtocol
    - exam.dm.state.progress => state.examProgress
    - page.result => results.current


    */

    // Definining variables
    // TODO: Should these variables be moved to a model?
    protocolStack:Array<any> = [];
    cha = {
        myCha: "",
        streaming: false
    };
    nRemove: any;
    nPages: any;

    
    switchToAdminView() {
        console.log("ExamService switchToAdminView() called");
    }

    switchToExamView() {
        console.log("ExamService switchToExamView() called");

        // hide tasks by default when moving to exam view
        // tasks.hide();

        let finishSwitch: ( () => void ) = () => {
            // Call plugins act
            // plugins.runEvent("switchToExamView", { disk: disk, page: page.dm });

            // TODO: Is this needed?
            // switch the view
            // router.goto("EXAM");

            console.log("this.protocol.activeProtocol",this.protocol.activeProtocol);
            // TODO: what is the '.id' field doing? Where should this be getting set?
            if (this.protocol.activeProtocol && this.protocol.activeProtocol.id) {
                this.logger.debug("re-activating page " + this.protocol.activeProtocol.id);
                this.finishActivate(this.protocol.activeProtocol, this.results.current);
            }
        }

        // try loading a protocol from disk.protocol if one is not already available
        if (_.isUndefined(this.protocol.activeProtocol)) {
            this.protocolService
                .load(undefined, this.disk.validateProtocols)
                .then(this.reset) // reset the test - still need to reset to show the proper 'exam disabled' note
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
    finishActivate(pg:any, result:any) {
        console.log("finishActivate called");
        var previous = JSON.parse(JSON.stringify(this.protocol.activeProtocol));
        if (JSON.stringify(previous.dm) == JSON.stringify(pg)) {
            //reset previous if it is identical to curent. This occurs if switching between admin mode / exam view.
            previous = {};
        }
        var bluetoothTimeout = 5000; // ~5 seconds seems to avoid beep

        // TODO: Below 2 lines are not needed?
        // page.dm = pg;
        // page.result = result;

        this.state.examState = ExamState.Testing;
        let streamRunning = false;

        this.logger.debug("streaming required:" + JSON.stringify(this.page.video || this.page.wavfiles || this.page.chaStream));

        if (
            (this.disk.headset === "Creare Headset" ||
            this.disk.headset === "WAHTS" ||
            // this.protocol.activeProtocol?.headset === "Creare Headset" ||
            this.protocol.activeProtocol?.headset === "WAHTS") &&
            (this.page.video || this.page.wavfiles || this.page.chaStream)
        ) {
            if (previous && previous.dm && (previous.dm.video || previous.dm.wavfiles || previous.dm.chaStream)) {
                this.logger.debug("Streaming mode should already be running");
                streamRunning = true;
            } else {
                this.page.loadingActive = true;
                this.page.loadingRequired = true;
                setTimeout( () => {
                    this.page.loadingActive = false;
                    this.logger.debug("this.page.loadingActive: "+this.page.loadingActive.toString());
                }, bluetoothTimeout);
            }
        } else {
            this.page.loadingActive = false;
            this.page.loadingRequired = false;
        }

        console.log("this.page",this.page);

        // pass in disk and page so they are available to the run functions
        // plugins.runEvent("pageStart", { disk: this.disk, page: page.dm })
        Promise.resolve()
            .then(async () => {
                // cha streaming
                if (
                    (this.disk.headset === "Creare Headset" ||
                        this.disk.headset === "WAHTS" ||
                        // this.protocol.activeProtocol?.headset === "Creare Headset" ||
                        this.protocol.activeProtocol?.headset === "WAHTS") &&
                        (this.page.video || this.page.wavfiles || this.page.chaStream) &&
                        (_.isUndefined(this.page.responseArea) ||
                    (!_.isUndefined(this.page.responseArea) && this.page.responseArea.type !== "externalAppResponseArea"))
                ) {
                    if (this.cha.myCha) {
                        if (!this.disk.disableAudioStreaming) {
                            // video should get into this one
                            if (!this.cha.streaming && !streamRunning) {
                                try {
                                    console.log("exam.service.ts - talkThrough not yet supported");
                                    // await chaExams.startTalkThrough();
                                    await new Promise(r => setTimeout(r, 1000));
                                    // if (!_.isUndefined(page.dm.volumeLevel)) {
                                    //   tabsintNative.setAudio(null, tabsintNative.onVolumeErr, page.dm.volumeLevel);
                                    //   console.log("Changing the tablet volume...", page.dm.volumeLevel);
                                    // }
                                } catch (e) {
                                    this.logger.debug("Could not start TalkThrough exam. Error was:" + e);
                                }
                            }
                            if (this.cha.streaming && !this.getNextPage()) {
                                // chaExams.stopTalkThrough();
                                console.log("chaExams.stopTalkThrough() called, but it isnt implemented yet");
                            }
                        } else {
                            this.notifications.alert(
                                this.translate.instant("Audio streaming is currently disabled. Streaming can be enabled in the WAHTS preferences on the Admin page. Please reload the protocol after enabling streaming.")
                            ).subscribe();
                        }
                    } else {
                        // notifications.alert("WAHTS is currently disconnected. Please reconnect WAHTS and restart exam.");
                    }
                } else {
                    // NOTE: this should not return because the promise gets conflicted with
                    // the cha-response-areas controller
                    this.results.current.responseStartTime = new Date();
                    // await chaExams.reset();
                }
            })

            // page setup functions
            .then( () => {
                // Start response timer
                this.results.current.responseStartTime = new Date();

                // If previous page was scrolled down this page will be too, scroll back to top - starting at the bottom is annoying!
                window.scrollTo(0, 0);
            })
            .then( () => {
                if (!this.page.loadingActive) {
                    this.finishActivateMedia();
                }
            });
    }

    getNextPage(): boolean {
        // if out of pages in this protocol before incrementing nPages, remove the protocol, but do not keep incrementing in the parent protocol
        if (this.nPages === undefined) {
            this.nPages = 1;
        }
        if (this.currPageQueue() && this.getCurrPageIndex() + this.nPages < this.currPageQueue().length) {
            _.last(this.protocolStack).pageIndex += this.nPages;
            return this.getCurrentPage();
        } else {
            this.removeCurrentProtocol(); // recurses until finding a parent protocol that isn't timed out and has pages left
            // if anything is left, return that page here
            if (this.protocolStack.length > 0) {
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
            this.protocolStack.pop();
        }
        // We are done; we don't expect any more questions.
        //state.nPagesExpected = state.nPagesDone; //TODO follow this logic - what does this change?

        // if any protocols left
        if (this.protocolStack.length > 0) {
            // if no pages left in this protocol, remove this one too
            if (this.getCurrPageIndex() + 1 > this.currPageQueue().length) {
                this.removeCurrentProtocol();
            } else {
                // increment parent protocol pagesDone counter, check timeouts
                this.protocolStack[this.protocolStack.length - 1].nPagesDone += 1;
                this.checkNPagesBasedTimeouts();
            }
        }
    }

    checkNPagesBasedTimeouts() {
        // Check for Npages-based timeouts (only last protocol in stack has
        // changing # of pages)
        if (this.currProtocol().timeout) {
            if (this.currProtocol().timeout.nMaxPages) {
                var nPagesDone = this.protocolStack[this.protocolStack.length - 1].nPagesDone;
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
        return this.protocolStack.length ? _.last(this.protocolStack).pageQueue : undefined;
    }

    getCurrPageIndex() {
        return this.protocolStack.length ? _.last(this.protocolStack).pageIndex : undefined;
    }

    finishActivateMedia() {
        Promise.resolve()

        // start automatic media
        .then( () => {
            // Start audio files(s) (if applicable):
            if (
                _.isUndefined(this.page.responseArea) ||
                (!_.isUndefined(this.page.responseArea) && this.page.responseArea.type !== "externalAppResponseArea")
            ) {
                // media.stopAudio();

                if (!_.isUndefined(this.page.wavfiles)) {
                    var startDelayTime = !_.isUndefined(this.page.wavfileStartDelayTime)
                        ? this.page.wavfileStartDelayTime
                        : 1000; // use default delay of 1000ms if no time specified

                    var playDelay = 0;

                    //Volume has already been set above
                    setTimeout(() => {
                        // media.playWav(this.page.wavfiles, startDelayTime, true);
                    }, playDelay);
                }
            }

            // Video handling
            if (!_.isUndefined(this.page.video)) {
                // tabsintNative.resetAudio(null, tabsintNative.onVolumeErr);

                // video object to hold important local information
                var video = {
                    submittable: !this.page.video.noSkip,
                    elem: undefined
                };

                // submittable logic only set once here
                this.page.isSubmittable = video.submittable;

                // setTimeout( () => {
                //     video.elem = document.getElementById("video1"); // mobile browsers often disable allowing auto-play.  Autoplay must be set in the html AND play must be called here
                //     if (page.dm.video.autoplay) {
                //         video.elem.play();
                //     }

                //     if (page.dm.video.noSkip) {
                //         video.elem.addEventListener("ended", () => {
                //             // wait until the video has ended to make our local handle false
                //             video.submittable = true;
                //             this.page.isSubmittable = video.submittable;
                //             $rootScope.$apply();
                //         });
                //     }
                // }, 250);
            }

            // CHA wav file handling
            if (this.page.chaWavFiles) {
                console.log('wavfile not yet supported');
                // chaExams.playSound(this.page.chaWavFiles);
            }
        });
    }
    
    help() {
        console.log("ExamService help() called");
        // if (exam.dm && page.dm && page.dm.helpText) {
        //     notifications.alert(page.dm.helpText);
        // }
    }

    reset(startPage?:any) {
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
        this.state.examProgress = {
            pctProgress: 0,
            anticipatedProtocols: [],
            activatedProtocols: []
        };

        // exam.dm.state.flags = {};
        // exam.dm.state.nRepeats = 0;

        var pg = {};
        if (this.disk.externalMode) {
            // pg = externalControlMode.resetExternal(startPage);
        } else {
            pg = this.resetInternal();
        }

        if (!pg) {
            return;
        }

        // TODO: Should this automatically happen in page model?
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
            return false;
        }
  
        // load protocol
        // this.protocolService.reset();
        this.protocolStack.splice(0, this.protocolStack.length); // reset/empty it.
  
        // prepare progress tracking structures.
        if (this.protocol.activeProtocol) {
            this.fillAnticipatedProtocols(this.protocol.activeProtocol);
            this.activateNewProtocol(this.protocol.activeProtocol);
        } else {
            this.state.examState = ExamState.NotReady;
            return false;
        }
  
        // Set up 'instruction' page.
        return this.currProtocol(); // shortcut
    }

    currProtocol() {
        /* Convenience fxn to get current protocol. Undefined if stack is empty. */
        return this.protocolStack.length ? _.last(this.protocolStack).protocol : undefined;
    }

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
        this.protocolStack.push(state);
  
        // for progress calculation, add protocol to activated protocols list and
        // remove from anticipated protocols list.
        this.state.examProgress.activatedProtocols.push(state);
        if (thisProtocol.protocolId) {
            this.state.examProgress.anticipatedProtocols = _.reject(this.state.examProgress.anticipatedProtocols, (container) => {
                return container.protocolId === thisProtocol.protocolId;
            });
        }
    }

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
        this.page.isSubmittable = true;
        this.submit = this.submitDefault;
        this.submit();
    }

    submitDefault() {
        console.log("ExamService submitDefault() called");

        this.page.isSubmittable = this.getSubmittableLogic(this.page.responseArea);
  
        // if not ready to submit, alert with error and just return.
        if (!this.page.isSubmittable) {
          this.logger.warning("Page is not submittable");
          return;
        }
  
        return this.finishPage()
            .then( () => this.pushResults) // save the current result and reset temp result object (page.result)
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
    }

    pushResults() {
        console.log("ExamService pushResults() called");
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
    }

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