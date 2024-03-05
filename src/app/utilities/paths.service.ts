import { Injectable } from '@angular/core';
import { AppM } from '../models/app/app.service';

@Injectable({
    providedIn: 'root',
})

export class Paths {

    constructor(
        public appM: AppM
    ) {}

    www(path: string): string {
        if (this.appM.appM.tablet) {
            path = "www/" + path;
        } else if (this.appM.appM.test) {
            path = "base/www/" + path;
        }
        return path;
    }    
    
}