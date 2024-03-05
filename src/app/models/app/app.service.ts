import { Injectable } from '@angular/core';
import { AppModel } from './app.interface';
import { Capacitor } from '@capacitor/core';

@Injectable({
    providedIn: 'root',
})

export class AppM {

    appM: AppModel = {
        tablet: Capacitor.getPlatform() === 'android',
        test: false,
        browser: Capacitor.getPlatform() === 'web'
    }

}