import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root',
})

export class ExamService {

    constructor () {  }
    
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
        console.log("ExamService skip() called");
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

    finishActivateMedia() {
        console.log("ExamService finishActivateMedia() called");
    }

}