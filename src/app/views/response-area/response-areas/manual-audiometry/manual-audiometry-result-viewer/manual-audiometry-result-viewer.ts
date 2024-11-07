import { Component, Input } from "@angular/core";

import { AudiogramDataStructInterface } from "../../../../../interfaces/audiogram.interface";

@Component({
    selector: 'manual-audiometry-result-viewer',
    templateUrl: './manual-audiometry-result-viewer.html',
    styleUrl: './manual-audiometry-result-viewer.css'
  })

export class ManualAudiometryResultViewerComponent {
    @Input() audiogramData: AudiogramDataStructInterface = {
        frequencies: [1000],
        thresholds: [null],
        channels: [''],
        resultTypes: [''],
        masking: [false]
    };

}