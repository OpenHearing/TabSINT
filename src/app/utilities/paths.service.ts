import { Injectable } from '@angular/core';

import { AppModel } from '../models/app/app.service';
import { AppInterface } from '../models/app/app.interface';

@Injectable({
    providedIn: 'root',
})

export class Paths {
    app: AppInterface;

    constructor(
        private appModel: AppModel
    ) {
        this.app = this.appModel.getApp();
    }

    www(path: string): string {
        if (this.app.tablet) {
            path = "www/" + path;
        } else if (this.app.test) {
            path = "base/www/" + path;
        }
        return path;
    }    
    
}