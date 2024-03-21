import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root',
})

export class ExamService {

    constructor () {  }
    
    help() {
        console.log("ExamService help() called");
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

}