import { Component, Input } from "@angular/core";

import { AudiometryResultsInterface } from "../../../../../interfaces/audiometry-results.interface";
import { ExamService } from "../../../../../controllers/exam.service";
import { ResultType } from "../../../../../utilities/constants";


@Component({
    selector: 'manual-audiometry-result-viewer',
    templateUrl: './manual-audiometry-result-viewer.html',
    styleUrl: './manual-audiometry-result-viewer.css'
  })

export class ManualAudiometryResultViewerComponent {
    @Input() audiogramData!: AudiometryResultsInterface;

    constructor(private readonly examService: ExamService, ){
    }

    submitResults() {
        this.examService.submitDefault();
      }

    get ResultType() {
        return ResultType;
    }
}