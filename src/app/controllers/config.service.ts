import { Injectable } from '@angular/core';
import {}

@Injectable({
    providedIn: 'root',
})

export class ConfigService {

    qRCodeUrl = false;

    generateQRCode() {
        console.log("generateQRCode button pressed");
    }

    async echoMessage() {
        try {
          const result = await .echo({ value: 'Hello, world!' });
          console.log('Echoed back:', result.value);
        } catch (error) {
          console.error('Error:', error);
        }
    }
    
}