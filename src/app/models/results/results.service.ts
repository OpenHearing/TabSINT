import { Injectable } from '@angular/core';
import { ResultsModel } from './results.interface';

@Injectable({
    providedIn: 'root',
})

export class ResultsM {

    resultsM: ResultsModel = {
        name: "name"
    }

}