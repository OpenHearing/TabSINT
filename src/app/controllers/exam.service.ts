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

@Injectable({
    providedIn: 'root',
})

export class ExamService {
    page: PageInterface;
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
        ) { 
        this.page = this.pageModel.getPage();
        this.results = this.resultsModel.getResults();
        this.protocolModel = this.protocolM.getProtocolModel();
        this.state = this.stateModel.getState();
    }
    
    help() {
        console.log("ExamService help() called");
        // if (exam.dm && page.dm && page.dm.helpText) {
        //     notifications.alert(page.dm.helpText);
        // }
    }

    reset() {
        console.log("ExamService reset() called");
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

        // page.dm.isSubmittable = exam.getSubmittableLogic(page.responseArea);
  
        // // if not ready to submit, alert with error and just return.
        // if (!page.dm.isSubmittable) {
        //   logger.warn("Page is not submittable");
        //   return;
        // }
  
        // return finishPage()
        //   .then(exam.pushResults) // save the current result and reset temp result object (page.result)
        //   .then(function() {
        //     if (page.dm.chaWavFiles && chaExams.state === "Playing") {
        //       // chaWavFile still playing. Clear interval in examLogic.
        //       return clearInterval(chaExams.playsoundInterval);
        //     }
        //   })
        //   .then(function() {
        //     if (disk.externalMode) {
        //       externalControlMode.submitExternal();
        //     } else {
        //       submitInternal();
        //     }
        // });
    };

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

    finishActivateMedia() {
        console.log("ExamService finishActivateMedia() called");
    }

}