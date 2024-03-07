import { Injectable } from '@angular/core';
import { ResultsInterface } from './results.interface';

@Injectable({
    providedIn: 'root',
})

export class ResultsModel {

    resultsModel: ResultsInterface = {
        name: "name"
    }

    getResults(): ResultsInterface {
        return this.resultsModel;
    }

}