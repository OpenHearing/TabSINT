import { Injectable } from '@angular/core';
import { ResultsInterface } from './results.interface';

@Injectable({
    providedIn: 'root',
})

export class ResultsModel {

    resultsModel: ResultsInterface = {
        name: "name",
        current: {},
        previous: []
    }

    getResults(): ResultsInterface {
        return this.resultsModel;
    }

}