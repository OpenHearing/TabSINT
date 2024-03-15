import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root',
})

export class ConfigService {

    qRCodeUrl = false;

    generateQRCode() {
        console.log("generateQRCode button pressed");
    }
    
}