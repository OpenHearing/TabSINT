import { Injectable } from '@angular/core';
import { AppModel } from './app.interface';

@Injectable({
    providedIn: 'root',
})

export class AppM {

    appM: AppModel = {
        name: "name"
    }

}