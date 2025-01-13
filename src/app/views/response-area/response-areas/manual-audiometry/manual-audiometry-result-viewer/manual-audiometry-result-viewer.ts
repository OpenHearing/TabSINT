import { Component, Input } from "@angular/core";

import { AudiometryResultsInterface } from "../../../../../interfaces/audiometry-results.interface";
import { ExamService } from "../../../../../controllers/exam.service";


@Component({
    selector: 'manual-audiometry-result-viewer',
    templateUrl: './manual-audiometry-result-viewer.html',
    styleUrl: './manual-audiometry-result-viewer.css'
  })

export class ManualAudiometryResultViewerComponent {
    @Input() audiogramData!: AudiometryResultsInterface;

    constructor(private readonly examService: ExamService, ){
      console.log('Audiogram Data Received:', this.audiogramData); // Debug log
    }

    submitResults() {
        this.examService.submitDefault();
      }

}