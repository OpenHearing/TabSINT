import { Injectable } from '@angular/core';
import { AppInterface } from './app.interface';
import { Capacitor } from '@capacitor/core';

@Injectable({
    providedIn: 'root',
})

export class AppModel {

    appModel: AppInterface = {
        tablet: Capacitor.getPlatform() === 'android',
        test: false,
        browser: Capacitor.getPlatform() === 'web'
    }

    getApp(): AppInterface {
        return this.appModel;
    }
}