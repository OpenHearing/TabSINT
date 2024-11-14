import { Component, Input } from "@angular/core";

import { AudiometryResultsInterface } from "../../../../../interfaces/audiometry-results.interface";
import { LevelUnits } from "../../../../../utilities/constants";

@Component({
    selector: 'manual-audiometry-result-viewer',
    templateUrl: './manual-audiometry-result-viewer.html',
    styleUrl: './manual-audiometry-result-viewer.css'
  })

export class ManualAudiometryResultViewerComponent {
    @Input() audiogramData: AudiometryResultsInterface = {
        frequencies: [1000],
        thresholds: [null],
        channels: [''],
        resultTypes: [''],
        masking: [false],
        levelUnits: LevelUnits.dB_SPL
    };

}