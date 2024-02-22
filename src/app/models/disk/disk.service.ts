import { Injectable } from '@angular/core';
import { DiskModel } from './disk.interface';

@Injectable({
    providedIn: 'root',
})

export class DiskM {

    diskM: DiskModel = {
        disableLogs: false,
        disableAudioStreaming: true
    }

}